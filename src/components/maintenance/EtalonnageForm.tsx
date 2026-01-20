import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Upload, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Equipement {
  id: string;
  code_equipement: string;
  nom: string;
  type: string;
}

interface EtalonnageFormProps {
  equipements: Equipement[];
  onSuccess: () => void;
}

export function EtalonnageForm({ equipements, onSuccess }: EtalonnageFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
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

  // Calculate écart and conformity
  const ecartPct = valeurReference && valeurMesuree 
    ? Math.abs(((parseFloat(valeurMesuree) - parseFloat(valeurReference)) / parseFloat(valeurReference)) * 100)
    : null;
  
  const isConforme = ecartPct !== null && ecartPct <= parseFloat(tolerancePct);

  const handleUploadCertificat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `certificat_${Date.now()}.${fileExt}`;
      const filePath = `etalonnages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('maintenance')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maintenance')
        .getPublicUrl(filePath);

      setCertificatUrl(publicUrl);
      toast.success('Certificat uploadé');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload du certificat');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!equipementId || !technicien || !valeurReference || !valeurMesuree) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert calibration record
      const { error: insertError } = await supabase
        .from('etalonnages')
        .insert({
          equipement_id: equipementId,
          type_etalonnage: typeEtalonnage,
          technicien,
          organisme_certificateur: organismeCertificateur || null,
          reference_certificat: referenceCertificat || null,
          valeur_reference: parseFloat(valeurReference),
          valeur_mesuree: parseFloat(valeurMesuree),
          ecart_pct: ecartPct,
          tolerance_pct: parseFloat(tolerancePct),
          conforme: isConforme,
          ajustements_effectues: ajustements || null,
          certificat_url: certificatUrl || null,
          prochaine_date: prochainDate || null,
          notes: notes || null,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      // Update equipment's last and next calibration dates
      const updateData: Record<string, string | null> = {
        dernier_etalonnage_at: new Date().toISOString().split('T')[0],
      };
      if (prochainDate) {
        updateData.prochain_etalonnage_at = prochainDate;
      }

      const { error: updateError } = await supabase
        .from('equipements')
        .update(updateData)
        .eq('id', equipementId);

      if (updateError) throw updateError;

      toast.success('Étalonnage enregistré avec succès');
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error saving calibration:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEquipementId('');
    setTypeEtalonnage('periodique');
    setTechnicien('');
    setOrganismeCertificateur('');
    setReferenceCertificat('');
    setValeurReference('');
    setValeurMesuree('');
    setTolerancePct('1');
    setAjustements('');
    setNotes('');
    setCertificatUrl('');
    setProchainDate('');
  };

  // Filter to only show equipment that needs calibration (balances, doseurs)
  const calibrableEquipements = equipements.filter(e => 
    ['balance', 'doseur', 'capteur'].includes(e.type)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Étalonnage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Enregistrer un Étalonnage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Equipment Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Équipement *</Label>
              <Select value={equipementId} onValueChange={setEquipementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {calibrableEquipements.map(equip => (
                    <SelectItem key={equip.id} value={equip.id}>
                      {equip.nom} ({equip.code_equipement})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type d'étalonnage</Label>
              <Select value={typeEtalonnage} onValueChange={setTypeEtalonnage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="periodique">Périodique</SelectItem>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="apres_reparation">Après réparation</SelectItem>
                  <SelectItem value="verification">Vérification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technician & Certifier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Technicien *</Label>
              <Input
                value={technicien}
                onChange={(e) => setTechnicien(e.target.value)}
                placeholder="Nom du technicien"
              />
            </div>

            <div className="space-y-2">
              <Label>Organisme certificateur</Label>
              <Input
                value={organismeCertificateur}
                onChange={(e) => setOrganismeCertificateur(e.target.value)}
                placeholder="Ex: LPEE, BM, Interne"
              />
            </div>
          </div>

          {/* Measurements */}
          <div className="p-4 rounded-lg bg-muted/30 border space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Mesures
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valeur de référence *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={valeurReference}
                  onChange={(e) => setValeurReference(e.target.value)}
                  placeholder="Ex: 10.000"
                />
              </div>

              <div className="space-y-2">
                <Label>Valeur mesurée *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={valeurMesuree}
                  onChange={(e) => setValeurMesuree(e.target.value)}
                  placeholder="Ex: 10.012"
                />
              </div>

              <div className="space-y-2">
                <Label>Tolérance (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tolerancePct}
                  onChange={(e) => setTolerancePct(e.target.value)}
                />
              </div>
            </div>

            {/* Results Display */}
            {ecartPct !== null && (
              <div className={cn(
                'p-4 rounded-lg flex items-center justify-between',
                isConforme ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'
              )}>
                <div className="flex items-center gap-3">
                  {isConforme ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isConforme ? 'CONFORME' : 'NON CONFORME'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Écart: {ecartPct.toFixed(3)}% (tolérance: ±{tolerancePct}%)
                    </p>
                  </div>
                </div>
                <Badge variant={isConforme ? 'default' : 'destructive'} className={isConforme ? 'bg-success' : ''}>
                  {ecartPct.toFixed(3)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Certificate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Référence certificat</Label>
              <Input
                value={referenceCertificat}
                onChange={(e) => setReferenceCertificat(e.target.value)}
                placeholder="N° du certificat"
              />
            </div>

            <div className="space-y-2">
              <Label>Certificat (PDF/Image)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadCertificat}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {certificatUrl && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-2">
            <Label>Ajustements effectués</Label>
            <Textarea
              value={ajustements}
              onChange={(e) => setAjustements(e.target.value)}
              placeholder="Décrire les ajustements ou corrections apportés..."
              rows={2}
            />
          </div>

          {/* Next Calibration Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prochaine date d'étalonnage</Label>
              <Input
                type="date"
                value={prochainDate}
                onChange={(e) => setProchainDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques additionnelles"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !equipementId || !technicien || !valeurReference || !valeurMesuree}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer l'étalonnage
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
