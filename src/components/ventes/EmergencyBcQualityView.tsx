import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap, FlaskConical, AlertTriangle, Eye, Clock, CheckCircle, Package, Loader2, ListChecks,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmergencyBcNotifications } from '@/hooks/useEmergencyBcNotifications';
import { EmergencyBcActionItemsPanel } from './EmergencyBcActionItemsPanel';
import { format, parseISO } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface EmergencyBc {
  id: string;
  bc_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  date_livraison_souhaitee: string | null;
  notes: string | null;
  created_at: string;
  statut: string;
  client?: { nom_client: string };
  formule?: { designation: string; ciment_kg_m3: number | null; adjuvant_l_m3: number | null };
}

interface EmergencyBcQualityViewProps {
  onNavigateToPlanning?: (date: string) => void;
}

export function EmergencyBcQualityView({ onNavigateToPlanning }: EmergencyBcQualityViewProps) {
  const { isResponsableTechnique, isCeo, isSuperviseur, canViewEmergencyBcs } = useAuth();
  const { productionNotifications } = useEmergencyBcNotifications();
  const { t, lang } = useI18n();
  const eq = t.emergencyQuality;
  const c = t.common;
  const dateLocale = getDateLocale(lang);
  const [emergencyBcs, setEmergencyBcs] = useState<EmergencyBc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBc, setSelectedBc] = useState<EmergencyBc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const fetchEmergencyBcs = async () => {
    if (!canViewEmergencyBcs) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('bons_commande')
        .select(`
          id, bc_id, client_id, formule_id, volume_m3, prix_vente_m3, total_ht,
          date_livraison_souhaitee, notes, created_at, statut,
          client:clients!client_id(nom_client),
          formule:formules_theoriques!formule_id(designation, ciment_kg_m3, adjuvant_l_m3)
        `)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const emergencyOnly = (data || []).filter(bc => 
        bc.notes?.includes('[URGENCE/EMERGENCY')
      );
      
      setEmergencyBcs(emergencyOnly);
    } catch (error) {
      console.error('Error fetching emergency BCs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyBcs();
    
    const channel = supabase
      .channel('emergency-bc-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bons_commande',
      }, () => {
        fetchEmergencyBcs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewEmergencyBcs]);

  const parseEmergencyReason = (notes: string | null): string => {
    if (!notes) return eq.notSpecified;
    const match = notes.match(/\[URGENCE\/EMERGENCY - [^\]]+\]\s*([^\n]+)/);
    return match ? match[1] : eq.notSpecified;
  };

  if (!canViewEmergencyBcs || emergencyBcs.length === 0) return null;
  if (!isResponsableTechnique && !isCeo && !isSuperviseur) return null;

  return (
    <>
      <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="relative">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            {eq.nightEmergencyOrders}
            <Badge variant="destructive" className="ml-auto gap-1">
              <AlertTriangle className="h-3 w-3" />
              {emergencyBcs.length} {eq.toVerify}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{eq.nightBcCreated}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BC</TableHead>
                  <TableHead>{c.client}</TableHead>
                  <TableHead>{eq.formula}</TableHead>
                  <TableHead className="text-right">{c.volume}</TableHead>
                  <TableHead>{eq.urgencyReason}</TableHead>
                  <TableHead>{c.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencyBcs.map((bc) => (
                  <TableRow key={bc.id} className="bg-amber-500/5 hover:bg-amber-500/10">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bc.bc_id}</span>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">
                          {format(parseISO(bc.created_at), 'HH:mm', { locale: dateLocale || undefined })}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{bc.client?.nom_client || bc.client_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{bc.formule_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{bc.formule?.designation}</p>
                    </TableCell>
                    <TableCell className="text-right">{bc.volume_m3} m³</TableCell>
                    <TableCell>
                      <p className="text-sm text-amber-700 max-w-[200px] truncate">
                        {parseEmergencyReason(bc.notes)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => { setSelectedBc(bc); setDetailOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                        {eq.verify}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {eq.techVerification} - {selectedBc?.bc_id}
            </DialogTitle>
            <DialogDescription>{eq.verifyFormula}</DialogDescription>
          </DialogHeader>
          
          {selectedBc && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  {eq.bcDetails}
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  {eq.productionActions}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-amber-700">{eq.emergencyOrder}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>{eq.reason}:</strong> {parseEmergencyReason(selectedBc.notes)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {eq.createdOn} {format(parseISO(selectedBc.created_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">{c.client}</p>
                    <p className="font-semibold">{selectedBc.client?.nom_client}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">{c.volume}</p>
                    <p className="font-semibold">{selectedBc.volume_m3} m³</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{eq.formula}: {selectedBc.formule_id}</span>
                  </div>
                  <p className="text-sm mb-2">{selectedBc.formule?.designation}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{eq.ciment}:</span>{' '}
                      <span className="font-mono">{selectedBc.formule?.ciment_kg_m3 || '—'} kg/m³</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{eq.adjuvant}:</span>{' '}
                      <span className="font-mono">{selectedBc.formule?.adjuvant_l_m3 || '—'} L/m³</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{eq.verificationPoints}</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {eq.formulaAdapted}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {eq.cementDosage}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {eq.adjuvantsOk}
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setDetailOpen(false)}>
                    {c.close}
                  </Button>
                  {onNavigateToPlanning && selectedBc.date_livraison_souhaitee && (
                    <Button 
                      className="flex-1 gap-2"
                      onClick={() => {
                        setDetailOpen(false);
                        onNavigateToPlanning(selectedBc.date_livraison_souhaitee!);
                      }}
                    >
                      <Clock className="h-4 w-4" />
                      {eq.viewPlanning}
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                {(() => {
                  const matchingNotification = productionNotifications.find(
                    n => n.bc_id === selectedBc.bc_id
                  );
                  
                  if (matchingNotification) {
                    return (
                      <EmergencyBcActionItemsPanel 
                        notificationId={matchingNotification.id}
                        bcId={selectedBc.bc_id}
                      />
                    );
                  }
                  
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListChecks className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{eq.noProductionActions}</p>
                      <p className="text-sm">{eq.actionsAfterApproval}</p>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
