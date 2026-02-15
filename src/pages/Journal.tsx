import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import {
  CalendarIcon, Printer, RefreshCw, Truck, Banknote, CreditCard,
  CheckCircle2, Package, Mail, Loader2, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const j = t.pages.journal;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('bons_livraison_reels')
      .select('bl_id, date_livraison, client_id, formule_id, volume_m3, prix_vente_m3, mode_paiement, statut_paiement, workflow_status, heure_retour_centrale')
      .eq('date_livraison', dateStr)
      .in('workflow_status', ['livre', 'facture'])
      .order('heure_retour_centrale', { ascending: true, nullsFirst: false });

    if (error) { console.error(error); setLoading(false); return; }

    const clientIds = [...new Set((data || []).map(d => d.client_id))];
    const { data: clients } = await supabase.from('clients').select('client_id, nom_client').in('client_id', clientIds);
    const clientMap = new Map(clients?.map(c => [c.client_id, c.nom_client]) || []);

    setEntries((data || []).map(entry => ({
      ...entry,
      client_name: clientMap.get(entry.client_id) || entry.client_id,
      total_ht: (entry.volume_m3 || 0) * (entry.prix_vente_m3 || 0),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, [selectedDate]);

  const totals = useMemo(() => {
    const volumeTotal = entries.reduce((sum, e) => sum + (e.volume_m3 || 0), 0);
    const caTotal = entries.reduce((sum, e) => sum + e.total_ht, 0);
    const cashEntries = entries.filter(e => e.mode_paiement === 'especes');
    const cashCollected = cashEntries.filter(e => e.statut_paiement === 'Payé').reduce((sum, e) => sum + e.total_ht, 0);
    const cashPending = cashEntries.filter(e => e.statut_paiement !== 'Payé').reduce((sum, e) => sum + e.total_ht, 0);
    const creditTotal = entries.filter(e => e.mode_paiement !== 'especes').reduce((sum, e) => sum + e.total_ht, 0);
    return { volumeTotal, caTotal, cashCollected, cashPending, creditTotal, deliveryCount: entries.length };
  }, [entries]);

  const getPaymentBadge = (mode: string | null, status: string) => {
    if (status === 'Payé') return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
        <CheckCircle2 className="h-3 w-3" />{j.paid}
      </Badge>
    );
    if (mode === 'especes') return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
        <Banknote className="h-3 w-3" />{j.cashPending}
      </Badge>
    );
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
        <CreditCard className="h-3 w-3" />{j.creditMode}
      </Badge>
    );
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase.functions.invoke('send-daily-journal', { body: { targetDate: dateStr, manual: true } });
      if (error) throw error;
      toast.success(`${j.reportSent}`);
    } catch (error: any) {
      console.error(error);
      toast.error(`${j.reportError}: ${error.message || ''}`);
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              {j.title}
            </h1>
            <p className="text-muted-foreground">{j.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale || undefined })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (date) { setSelectedDate(date); setCalendarOpen(false); } }} locale={dateLocale || undefined} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={fetchEntries} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />{j.print}
            </Button>
            <Button onClick={handleSendReport} disabled={sendingReport} className="gap-2">
              {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {j.sendReport}
            </Button>
          </div>
        </div>

        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">{j.printHeader}</h1>
          <p className="text-sm">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale || undefined })}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <Card className="print:border print:shadow-none"><CardContent className="pt-4 print:p-2"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10 print:hidden"><Truck className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold print:text-lg">{totals.deliveryCount}</p><p className="text-xs text-muted-foreground">{j.deliveries}</p></div></div></CardContent></Card>
          <Card className="print:border print:shadow-none"><CardContent className="pt-4 print:p-2"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10 print:hidden"><Package className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold print:text-lg">{totals.volumeTotal.toFixed(1)} m³</p><p className="text-xs text-muted-foreground">{j.volumeTotal}</p></div></div></CardContent></Card>
          <Card className="print:border print:shadow-none"><CardContent className="pt-4 print:p-2"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10 print:hidden"><Banknote className="h-5 w-5 text-emerald-500" /></div><div><p className="text-2xl font-bold print:text-lg">{totals.cashCollected.toLocaleString()} DH</p><p className="text-xs text-muted-foreground">{j.cashCollected}</p></div></div></CardContent></Card>
          <Card className="print:border print:shadow-none"><CardContent className="pt-4 print:p-2"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-violet-500/10 print:hidden"><TrendingUp className="h-5 w-5 text-violet-500" /></div><div><p className="text-2xl font-bold print:text-lg">{totals.caTotal.toLocaleString()} DH</p><p className="text-xs text-muted-foreground">{j.caTotal}</p></div></div></CardContent></Card>
        </div>

        <Card className="print:border print:shadow-none">
          <CardHeader className="print:py-2"><CardTitle className="text-lg print:text-base">{j.deliveryDetails}</CardTitle></CardHeader>
          <CardContent className="print:p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Truck className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>{j.noDeliveries}</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="print:text-xs">{j.blNumber}</TableHead>
                    <TableHead className="print:text-xs">{j.client}</TableHead>
                    <TableHead className="print:text-xs">{j.formula}</TableHead>
                    <TableHead className="text-right print:text-xs">{j.volume}</TableHead>
                    <TableHead className="text-right print:text-xs">{j.amountHT}</TableHead>
                    <TableHead className="print:text-xs">{j.mode}</TableHead>
                    <TableHead className="print:text-xs">{j.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.bl_id}>
                      <TableCell className="font-mono text-sm print:text-xs">{entry.bl_id}</TableCell>
                      <TableCell className="font-medium print:text-xs">{entry.client_name}</TableCell>
                      <TableCell className="print:text-xs">{entry.formule_id}</TableCell>
                      <TableCell className="text-right print:text-xs">{entry.volume_m3} m³</TableCell>
                      <TableCell className="text-right font-medium print:text-xs">{entry.total_ht.toLocaleString()} DH</TableCell>
                      <TableCell className="print:text-xs">
                        {entry.mode_paiement === 'especes' ? (
                          <span className="flex items-center gap-1 text-emerald-600"><Banknote className="h-3 w-3" />{j.cash}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-600"><CreditCard className="h-3 w-3" />{j.creditMode}</span>
                        )}
                      </TableCell>
                      <TableCell className="print:text-xs">{getPaymentBadge(entry.mode_paiement, entry.statut_paiement)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/50 print:bg-gray-100">
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold print:text-xs">{j.totals}</TableCell>
                    <TableCell className="text-right font-bold print:text-xs">{totals.volumeTotal.toFixed(1)} m³</TableCell>
                    <TableCell className="text-right font-bold print:text-xs">{totals.caTotal.toLocaleString()} DH</TableCell>
                    <TableCell colSpan={2} className="print:text-xs">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-emerald-600">{j.cash}: {totals.cashCollected.toLocaleString()} DH</span>
                        <span className="text-blue-600">{j.creditMode}: {totals.creditTotal.toLocaleString()} DH</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          <Card className="border-emerald-200 dark:border-emerald-800 print:border">
            <CardHeader className="pb-2 print:py-2">
              <CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-500" />{j.cashCollection}</CardTitle>
            </CardHeader>
            <CardContent className="print:p-2">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">{j.collected}</span><span className="font-bold text-emerald-600">{totals.cashCollected.toLocaleString()} DH</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{j.pending}</span><span className="font-medium text-amber-600">{totals.cashPending.toLocaleString()} DH</span></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800 print:border">
            <CardHeader className="pb-2 print:py-2">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" />{j.creditBilling}</CardTitle>
            </CardHeader>
            <CardContent className="print:p-2">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">{j.totalInvoiced}</span><span className="font-bold text-blue-600">{totals.creditTotal.toLocaleString()} DH</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
