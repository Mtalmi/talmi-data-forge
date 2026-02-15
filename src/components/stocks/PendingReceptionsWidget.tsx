import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Camera, ClipboardCheck, FlaskConical, Loader2, Check, Image, Droplets, Eye,
  AlertTriangle, Scale, FileText, Mountain, Truck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

interface PendingReception {
  id: string; materiau: string; quantite: number; fournisseur: string; numero_bl: string;
  photo_materiel_url: string | null; photo_bl_url: string | null; photo_gravel_url: string | null;
  photo_humidity_url: string | null; humidite_pct: number | null; qualite_visuelle: string | null;
  notes_qualite: string | null; statut: string; created_at: string; qualite_approuvee_at: string | null;
}

interface PendingReceptionsWidgetProps { onRefresh?: () => void; }

export function PendingReceptionsWidget({ onRefresh }: PendingReceptionsWidgetProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isCeo, isSuperviseur, isAgentAdministratif } = useAuth();
  const [receptions, setReceptions] = useState<PendingReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReception, setSelectedReception] = useState<PendingReception | null>(null);
  const [validating, setValidating] = useState(false);
  const [poidsPesee, setPoidsPesee] = useState('');
  const [numeroFacture, setNumeroFacture] = useState('');
  const [notesAdmin, setNotesAdmin] = useState('');

  const canValidate = isCeo || isSuperviseur || isAgentAdministratif;

  useEffect(() => {
    fetchPendingReceptions();
    const channel = supabase.channel('pending-receptions').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_receptions_pending' }, () => fetchPendingReceptions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPendingReceptions = async () => {
    try {
      const { data, error } = await supabase.from('stock_receptions_pending').select('*').eq('statut', 'approuve_qualite').order('created_at', { ascending: false });
      if (error) throw error;
      setReceptions(data || []);
    } catch (error) { console.error('Error fetching pending receptions:', error); } finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!selectedReception) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_stock_reception', { p_reception_id: selectedReception.id, p_poids_pesee: poidsPesee ? parseFloat(poidsPesee) : null, p_numero_facture: numeroFacture || null, p_notes: notesAdmin || null });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) { toast.error(result.error || t.pages.stocks.validationError); return; }
      toast.success(result.message || t.pages.stocks.stockAddedToSilos);
      setSelectedReception(null); resetForm(); fetchPendingReceptions(); onRefresh?.();
    } catch (error) { console.error('Error validating reception:', error); toast.error(t.pages.stocks.validationError); } finally { setValidating(false); }
  };

  const resetForm = () => { setPoidsPesee(''); setNumeroFacture(''); setNotesAdmin(''); };
  const openValidationDialog = (reception: PendingReception) => { setSelectedReception(reception); setPoidsPesee(reception.quantite.toString()); resetForm(); };

  if (!canValidate) return null;
  if (loading) return (<Card><CardContent className="py-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>);
  if (receptions.length === 0) return null;

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {t.pages.stocks.receptionsToValidate}
            <Badge variant="secondary" className="ml-auto animate-pulse bg-primary/20 text-primary">{receptions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {receptions.map((reception) => (
            <div key={reception.id} className={cn('p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors', reception.qualite_visuelle === 'non_conforme' && 'border-destructive/50 bg-destructive/5')} onClick={() => openValidationDialog(reception)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><FlaskConical className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="font-medium">{reception.materiau}</p>
                    <p className="text-sm text-muted-foreground">{reception.quantite.toLocaleString()} • {reception.fournisseur}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={cn('text-xs',
                    reception.qualite_visuelle === 'conforme' ? 'bg-success/10 text-success border-success/30' :
                    reception.qualite_visuelle === 'reserve' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-destructive/10 text-destructive border-destructive/30'
                  )}>
                    <Check className="h-3 w-3 mr-1" />
                    {reception.qualite_visuelle === 'conforme' ? t.pages.stocks.qualityOk : reception.qualite_visuelle === 'reserve' ? t.pages.stocks.reserve : t.pages.stocks.nonCompliant}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reception.qualite_approuvee_at ? format(new Date(reception.qualite_approuvee_at), 'dd/MM HH:mm', { locale: dateLocale || undefined }) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                {reception.photo_gravel_url && (<span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20"><Mountain className="h-2.5 w-2.5" /> {t.pages.stocks.gravel}</span>)}
                {reception.photo_humidity_url && (<span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20"><Droplets className="h-2.5 w-2.5" /> {t.pages.stocks.humidity}</span>)}
                {reception.photo_materiel_url && (<span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border"><Truck className="h-2.5 w-2.5" /> {t.pages.stocks.truck}</span>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReception} onOpenChange={(open) => !open && setSelectedReception(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />{t.pages.stocks.doubleValidation}</DialogTitle>
          </DialogHeader>
          {selectedReception && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-success/5 border border-success/30">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><FlaskConical className="h-4 w-4 text-success" />{t.pages.stocks.qualityApprovedByTech}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t.pages.stocks.material}:</span><p className="font-medium">{selectedReception.materiau}</p></div>
                  <div><span className="text-muted-foreground">{t.pages.stocks.declaredQuantity}</span><p className="font-medium">{selectedReception.quantite.toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground">{t.pages.stocks.supplier}:</span><p className="font-medium">{selectedReception.fournisseur}</p></div>
                  <div><span className="text-muted-foreground">{t.pages.stocks.blNumberLabel}</span><p className="font-medium">{selectedReception.numero_bl}</p></div>
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-success/20">
                  {selectedReception.humidite_pct != null && (<div className="flex items-center gap-1"><Droplets className="h-4 w-4 text-primary" /><span className="text-sm">{selectedReception.humidite_pct}%</span></div>)}
                  <div className="flex items-center gap-1"><Eye className="h-4 w-4 text-success" /><span className="text-sm capitalize">{selectedReception.qualite_visuelle}</span></div>
                </div>
                {selectedReception.notes_qualite && (<p className="text-xs text-muted-foreground mt-2 italic">"{selectedReception.notes_qualite}"</p>)}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />{t.pages.stocks.photoEvidence}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReception.photo_gravel_url && (
                    <a href={selectedReception.photo_gravel_url} target="_blank" rel="noopener noreferrer"><div className="relative rounded-lg border overflow-hidden group"><img src={selectedReception.photo_gravel_url} alt={t.pages.stocks.gravel} className="w-full h-28 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Image className="h-5 w-5 text-white" /></div><Badge className="absolute bottom-1 left-1 text-[10px] bg-success/90 gap-1"><Mountain className="h-2.5 w-2.5" /> {t.pages.stocks.gravel}</Badge></div></a>
                  )}
                  {selectedReception.photo_humidity_url && (
                    <a href={selectedReception.photo_humidity_url} target="_blank" rel="noopener noreferrer"><div className="relative rounded-lg border overflow-hidden group"><img src={selectedReception.photo_humidity_url} alt={t.pages.stocks.humidity} className="w-full h-28 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Image className="h-5 w-5 text-white" /></div><Badge className="absolute bottom-1 left-1 text-[10px] bg-primary/90 gap-1"><Droplets className="h-2.5 w-2.5" /> {t.pages.stocks.humidity}</Badge></div></a>
                  )}
                  {selectedReception.photo_materiel_url && (
                    <a href={selectedReception.photo_materiel_url} target="_blank" rel="noopener noreferrer"><div className="relative rounded-lg border overflow-hidden group"><img src={selectedReception.photo_materiel_url} alt={t.pages.stocks.truck} className="w-full h-28 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Image className="h-5 w-5 text-white" /></div><Badge variant="outline" className="absolute bottom-1 left-1 text-[10px] gap-1"><Truck className="h-2.5 w-2.5" /> {t.pages.stocks.truck}</Badge></div></a>
                  )}
                  {selectedReception.photo_bl_url && (
                    <a href={selectedReception.photo_bl_url} target="_blank" rel="noopener noreferrer"><div className="relative rounded-lg border overflow-hidden group"><img src={selectedReception.photo_bl_url} alt="BL" className="w-full h-28 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Image className="h-5 w-5 text-white" /></div><Badge variant="outline" className="absolute bottom-1 left-1 text-[10px]">BL</Badge></div></a>
                  )}
                </div>
              </div>

              {selectedReception.qualite_visuelle === 'non_conforme' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{t.pages.stocks.nonCompliantMaterial}</p>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Scale className="h-4 w-4" />{t.pages.stocks.frontDeskValidation}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.pages.stocks.weighedWeight}</Label>
                    <Input type="number" step="0.01" placeholder={selectedReception.quantite.toString()} value={poidsPesee} onChange={(e) => setPoidsPesee(e.target.value)} className="min-h-[48px]" />
                    <p className="text-xs text-muted-foreground">{t.pages.stocks.leaveEmptyForDeclared}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><FileText className="h-3 w-3" />{t.pages.stocks.invoiceNumber}</Label>
                    <Input placeholder="FAC-2024-001" value={numeroFacture} onChange={(e) => setNumeroFacture(e.target.value)} className="min-h-[48px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.pages.stocks.frontDeskNotes}</Label>
                  <Textarea placeholder={t.pages.stocks.remarks} value={notesAdmin} onChange={(e) => setNotesAdmin(e.target.value)} rows={2} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 min-h-[48px]" onClick={() => setSelectedReception(null)}>{t.pages.stocks.cancel}</Button>
                <Button onClick={handleValidate} disabled={validating} className="flex-1 min-h-[48px] gap-2 bg-success hover:bg-success/90">
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t.pages.stocks.validateAddToSilo}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
