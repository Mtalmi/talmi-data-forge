import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface Equipement { id: string; code_equipement: string; nom: string; type: string; }
interface EtalonnageFormProps { equipements: Equipement[]; onSuccess: () => void; }

export function EtalonnageForm({ equipements, onSuccess }: EtalonnageFormProps) {
  const { t } = useI18n();
  const et = t.etalonnage;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [equipementId, setEquipementId] = useState('');
  const [typeEtalonnage, setTypeEtalonnage] = useState('periodique');
  const [technicien, setTechnicien] = useState('');
  const [organismeCertificateur, setOrganismeCertificateur] = useState('');
  const [referenceCertificat, setReferenceCertificat] = useState('');
  const [valeurReference, setValeurReference] = useState('');
  const [valeurMesuree, setValeurMesuree] = useState('');
  const [tolerancePct, setTolerancePct] = useState('1');
  const [ajustements, setAjustements] = useState('');
  const [notes, setNotes] = useState('');
  const [certificatUrl, setCertificatUrl] = useState('');
  const [prochainDate, setProchainDate] = useState('');

  const ecartPct = valeurReference && valeurMesuree ? Math.abs(((parseFloat(valeurMesuree) - parseFloat(valeurReference)) / parseFloat(valeurReference)) * 100) : null;
  const isConforme = ecartPct !== null && ecartPct <= parseFloat(tolerancePct);

  const handleUploadCertificat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `certificat_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('maintenance').upload(`etalonnages/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('maintenance').getPublicUrl(`etalonnages/${fileName}`);
      setCertificatUrl(publicUrl);
      toast.success(et.certUploaded);
    } catch (error) { console.error('Upload error:', error); toast.error(et.certUploadError); } finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!equipementId || !technicien || !valeurReference || !valeurMesuree) { toast.error(et.requiredFields); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from('etalonnages').insert({
        equipement_id: equipementId, type_etalonnage: typeEtalonnage, technicien,
        organisme_certificateur: organismeCertificateur || null, reference_certificat: referenceCertificat || null,
        valeur_reference: parseFloat(valeurReference), valeur_mesuree: parseFloat(valeurMesuree),
        ecart_pct: ecartPct, tolerance_pct: parseFloat(tolerancePct), conforme: isConforme,
        ajustements_effectues: ajustements || null, certificat_url: certificatUrl || null,
        prochaine_date: prochainDate || null, notes: notes || null, created_by: user?.id,
      });
      if (insertError) throw insertError;
      const updateData: Record<string, string | null> = { dernier_etalonnage_at: new Date().toISOString().split('T')[0] };
      if (prochainDate) updateData.prochain_etalonnage_at = prochainDate;
      const { error: updateError } = await supabase.from('equipements').update(updateData).eq('id', equipementId);
      if (updateError) throw updateError;
      toast.success(et.saved); setOpen(false); resetForm(); onSuccess();
    } catch (error) { console.error('Error saving calibration:', error); toast.error(et.saveError); } finally { setSaving(false); }
  };

  const resetForm = () => { setEquipementId(''); setTypeEtalonnage('periodique'); setTechnicien(''); setOrganismeCertificateur(''); setReferenceCertificat(''); setValeurReference(''); setValeurMesuree(''); setTolerancePct('1'); setAjustements(''); setNotes(''); setCertificatUrl(''); setProchainDate(''); };

  const calibrableEquipements = equipements.filter(e => ['balance', 'doseur', 'capteur'].includes(e.type));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{et.newCalibration}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />{et.title}</DialogTitle></DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{et.equipment}</Label>
              <Select value={equipementId} onValueChange={setEquipementId}><SelectTrigger><SelectValue placeholder={et.select} /></SelectTrigger>
                <SelectContent>{calibrableEquipements.map(equip => (<SelectItem key={equip.id} value={equip.id}>{equip.nom} ({equip.code_equipement})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{et.type}</Label>
              <Select value={typeEtalonnage} onValueChange={setTypeEtalonnage}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="periodique">{et.periodic}</SelectItem><SelectItem value="initial">{et.initial}</SelectItem>
                  <SelectItem value="apres_reparation">{et.afterRepair}</SelectItem><SelectItem value="verification">{et.verification}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{et.technician}</Label><Input value={technicien} onChange={(e) => setTechnicien(e.target.value)} placeholder={et.technicianPlaceholder} /></div>
            <div className="space-y-2"><Label>{et.certifier}</Label><Input value={organismeCertificateur} onChange={(e) => setOrganismeCertificateur(e.target.value)} placeholder={et.certifierPlaceholder} /></div>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border space-y-4">
            <h4 className="font-medium flex items-center gap-2"><Scale className="h-4 w-4" />{et.measurements}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{et.referenceValue}</Label><Input type="number" step="0.001" value={valeurReference} onChange={(e) => setValeurReference(e.target.value)} placeholder="Ex: 10.000" /></div>
              <div className="space-y-2"><Label>{et.measuredValue}</Label><Input type="number" step="0.001" value={valeurMesuree} onChange={(e) => setValeurMesuree(e.target.value)} placeholder="Ex: 10.012" /></div>
              <div className="space-y-2"><Label>{et.tolerance}</Label><Input type="number" step="0.1" value={tolerancePct} onChange={(e) => setTolerancePct(e.target.value)} /></div>
            </div>
            {ecartPct !== null && (
              <div className={cn('p-4 rounded-lg flex items-center justify-between', isConforme ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30')}>
                <div className="flex items-center gap-3">
                  {isConforme ? <CheckCircle2 className="h-6 w-6 text-success" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
                  <div><p className="font-medium">{isConforme ? et.conform : et.nonConform}</p><p className="text-sm text-muted-foreground">{et.deviation} {ecartPct.toFixed(3)}% ({et.toleranceLabel} ±{tolerancePct}%)</p></div>
                </div>
                <Badge variant={isConforme ? 'default' : 'destructive'} className={isConforme ? 'bg-success' : ''}>{ecartPct.toFixed(3)}%</Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{et.certRef}</Label><Input value={referenceCertificat} onChange={(e) => setReferenceCertificat(e.target.value)} placeholder={et.certRefPlaceholder} /></div>
            <div className="space-y-2">
              <Label>{et.certFile}</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadCertificat} disabled={uploading} className="flex-1" />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {certificatUrl && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          </div>

          <div className="space-y-2"><Label>{et.adjustments}</Label><Textarea value={ajustements} onChange={(e) => setAjustements(e.target.value)} placeholder={et.adjustmentsPlaceholder} rows={2} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{et.nextDate}</Label><Input type="date" value={prochainDate} onChange={(e) => setProchainDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>{et.notesLabel}</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={et.notesPlaceholder} /></div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>{et.cancel}</Button>
            <Button onClick={handleSubmit} disabled={saving || !equipementId || !technicien || !valeurReference || !valeurMesuree}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{et.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
