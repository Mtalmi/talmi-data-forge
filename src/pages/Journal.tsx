import { useState, useEffect, useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  CalendarIcon,
  Printer,
  RefreshCw,
  Truck,
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalEntry {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  client_name: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  total_ht: number;
  mode_paiement: string | null;
  statut_paiement: string;
  workflow_status: string | null;
  heure_retour_centrale: string | null;
}

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('bons_livraison_reels')
      .select(`
        bl_id,
        date_livraison,
        client_id,
        formule_id,
        volume_m3,
        prix_vente_m3,
        mode_paiement,
        statut_paiement,
        workflow_status,
        heure_retour_centrale
      `)
      .eq('date_livraison', dateStr)
      .in('workflow_status', ['livre', 'facture'])
      .order('heure_retour_centrale', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      setLoading(false);
      return;
    }

    // Fetch client names
    const clientIds = [...new Set((data || []).map(d => d.client_id))];
    const { data: clients } = await supabase
      .from('clients')
      .select('client_id, nom_client')
      .in('client_id', clientIds);

    const clientMap = new Map(clients?.map(c => [c.client_id, c.nom_client]) || []);

    const enrichedEntries: JournalEntry[] = (data || []).map(entry => ({
      ...entry,
      client_name: clientMap.get(entry.client_id) || entry.client_id,
      total_ht: (entry.volume_m3 || 0) * (entry.prix_vente_m3 || 0),
    }));

    setEntries(enrichedEntries);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const volumeTotal = entries.reduce((sum, e) => sum + (e.volume_m3 || 0), 0);
    const caTotal = entries.reduce((sum, e) => sum + e.total_ht, 0);
    
    const cashEntries = entries.filter(e => e.mode_paiement === 'especes');
    const cashCollected = cashEntries
      .filter(e => e.statut_paiement === 'Payé')
      .reduce((sum, e) => sum + e.total_ht, 0);
    const cashPending = cashEntries
      .filter(e => e.statut_paiement !== 'Payé')
      .reduce((sum, e) => sum + e.total_ht, 0);
    
    const creditEntries = entries.filter(e => e.mode_paiement !== 'especes');
    const creditTotal = creditEntries.reduce((sum, e) => sum + e.total_ht, 0);
    
    const paidCount = entries.filter(e => e.statut_paiement === 'Payé').length;
    const pendingCount = entries.filter(e => e.statut_paiement === 'En Attente').length;
    
    return {
      volumeTotal,
      caTotal,
      cashCollected,
      cashPending,
      creditTotal,
      deliveryCount: entries.length,
      paidCount,
      pendingCount,
    };
  }, [entries]);

  const getPaymentBadge = (mode: string | null, status: string) => {
    const isCash = mode === 'especes';
    const isPaid = status === 'Payé';
    
    if (isPaid) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Payé
        </Badge>
      );
    }
    
    if (isCash) {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
          <Banknote className="h-3 w-3" />
          Cash - En Attente
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
        <CreditCard className="h-3 w-3" />
        Crédit
      </Badge>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Journal Quotidien
            </h1>
            <p className="text-muted-foreground">
              Suivi des livraisons terminées et encaissements
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" onClick={fetchEntries} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Journal des Livraisons</h1>
          <p className="text-sm">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <Card className="print:border print:shadow-none">
            <CardContent className="pt-4 print:p-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 print:hidden">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold print:text-lg">{totals.deliveryCount}</p>
                  <p className="text-xs text-muted-foreground">Livraisons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="print:border print:shadow-none">
            <CardContent className="pt-4 print:p-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 print:hidden">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold print:text-lg">{totals.volumeTotal.toFixed(1)} m³</p>
                  <p className="text-xs text-muted-foreground">Volume Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="print:border print:shadow-none">
            <CardContent className="pt-4 print:p-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 print:hidden">
                  <Banknote className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold print:text-lg">{totals.cashCollected.toLocaleString()} DH</p>
                  <p className="text-xs text-muted-foreground">Cash Encaissé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="print:border print:shadow-none">
            <CardContent className="pt-4 print:p-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 print:hidden">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold print:text-lg">{totals.caTotal.toLocaleString()} DH</p>
                  <p className="text-xs text-muted-foreground">CA Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="print:border print:shadow-none">
          <CardHeader className="print:py-2">
            <CardTitle className="text-lg print:text-base">Détail des Livraisons</CardTitle>
          </CardHeader>
          <CardContent className="print:p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucune livraison terminée pour cette date</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="print:text-xs">N° BL</TableHead>
                    <TableHead className="print:text-xs">Client</TableHead>
                    <TableHead className="print:text-xs">Formule</TableHead>
                    <TableHead className="text-right print:text-xs">Volume</TableHead>
                    <TableHead className="text-right print:text-xs">Montant HT</TableHead>
                    <TableHead className="print:text-xs">Mode</TableHead>
                    <TableHead className="print:text-xs">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.bl_id}>
                      <TableCell className="font-mono text-sm print:text-xs">
                        {entry.bl_id}
                      </TableCell>
                      <TableCell className="font-medium print:text-xs">
                        {entry.client_name}
                      </TableCell>
                      <TableCell className="print:text-xs">{entry.formule_id}</TableCell>
                      <TableCell className="text-right print:text-xs">
                        {entry.volume_m3} m³
                      </TableCell>
                      <TableCell className="text-right font-medium print:text-xs">
                        {entry.total_ht.toLocaleString()} DH
                      </TableCell>
                      <TableCell className="print:text-xs">
                        {entry.mode_paiement === 'especes' ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Banknote className="h-3 w-3" />
                            Cash
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-600">
                            <CreditCard className="h-3 w-3" />
                            Crédit
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="print:text-xs">
                        {getPaymentBadge(entry.mode_paiement, entry.statut_paiement)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/50 print:bg-gray-100">
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold print:text-xs">
                      TOTAUX
                    </TableCell>
                    <TableCell className="text-right font-bold print:text-xs">
                      {totals.volumeTotal.toFixed(1)} m³
                    </TableCell>
                    <TableCell className="text-right font-bold print:text-xs">
                      {totals.caTotal.toLocaleString()} DH
                    </TableCell>
                    <TableCell colSpan={2} className="print:text-xs">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-emerald-600">
                          Cash: {totals.cashCollected.toLocaleString()} DH
                        </span>
                        <span className="text-blue-600">
                          Crédit: {totals.creditTotal.toLocaleString()} DH
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          <Card className="border-emerald-200 dark:border-emerald-800 print:border">
            <CardHeader className="pb-2 print:py-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-500" />
                Encaissements Cash
              </CardTitle>
            </CardHeader>
            <CardContent className="print:p-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Encaissé</span>
                  <span className="font-bold text-emerald-600">
                    {totals.cashCollected.toLocaleString()} DH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En attente</span>
                  <span className="font-medium text-amber-600">
                    {totals.cashPending.toLocaleString()} DH
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 dark:border-blue-800 print:border">
            <CardHeader className="pb-2 print:py-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Facturation à Crédit
              </CardTitle>
            </CardHeader>
            <CardContent className="print:p-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total facturé</span>
                  <span className="font-bold text-blue-600">
                    {totals.creditTotal.toLocaleString()} DH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraisons</span>
                  <span className="font-medium">
                    {entries.filter(e => e.mode_paiement !== 'especes').length} BL
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          <p>Généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
        </div>
      </div>
    </MainLayout>
  );
}
