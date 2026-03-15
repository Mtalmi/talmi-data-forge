import { useState } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TYPES = [
  { value: 'toupie_8', label: 'Toupie 8m³', capacite: '8 m³' },
  { value: 'toupie_10', label: 'Toupie 10m³', capacite: '10 m³' },
  { value: 'toupie_12', label: 'Toupie 12m³', capacite: '12 m³' },
];

const DRIVERS = [
  { value: 'youssef', label: 'Youssef Benali' },
  { value: 'karim', label: 'Karim Idrissi' },
  { value: 'mehdi', label: 'Mehdi Tazi' },
  { value: 'omar', label: 'Omar Fassi' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (v: any) => void; }

export function NouveauVehiculeModal({ open, onClose, onCreated }: Props) {
  const [id, setId] = useState('');
  const [type, setType] = useState('');
  const [immat, setImmat] = useState('');
  const [chauffeur, setChauffeur] = useState('');
  const [dateMise, setDateMise] = useState('');
  const [dateMaint, setDateMaint] = useState('');
  const [etat, setEtat] = useState('actif');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedType = TYPES.find(t => t.value === type);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!id.trim()) e.id = 'Champ requis';
    if (!type) e.type = 'Champ requis';
    if (!immat.trim()) e.immat = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const capacite = selectedType?.value.includes('8') ? 8 : selectedType?.value.includes('10') ? 10 : 12;
      const driverLabel = DRIVERS.find(d => d.value === chauffeur)?.label || null;

      // Insert into flotte table
      const { error: insertError } = await supabase
        .from('flotte')
        .insert({
          id_camion: id,
          type_camion: selectedType?.label || type,
          immatriculation: immat,
          chauffeur_assigne: driverLabel,
          capacite_m3: capacite,
          statut: etat === 'actif' ? 'Disponible' : etat === 'maintenance' ? 'En Maintenance' : 'Hors Service',
          sante_score: 80,
        });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Véhicule ${id} ajouté — ${selectedType?.label}, ${immat}`,
        source_page: 'logistique',
        severite: 'success',
      });

      onCreated?.({ id, type: selectedType?.label, immat, chauffeur: driverLabel, etat });
      showFormSuccess(`✓ Véhicule ${id} ajouté avec succès`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible d\'ajouter le véhicule'}`);
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setId(''); setType(''); setImmat(''); setChauffeur(''); setDateMise(''); setDateMaint(''); setEtat('actif');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Ajouter un Véhicule" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Ajouter Véhicule</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow cols={3}>
          <TBOSField label="Identifiant" required error={errors.id}>
            <TBOSInput value={id} onChange={e => setId(e.target.value)} hasError={!!errors.id} placeholder="T-XX" />
          </TBOSField>
          <TBOSField label="Type" required error={errors.type}>
            <TBOSSelect value={type} onChange={e => setType(e.target.value)} hasError={!!errors.type}
              options={TYPES.map(t => ({ value: t.value, label: t.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Immatriculation" required error={errors.immat}>
            <TBOSInput value={immat} onChange={e => setImmat(e.target.value)} hasError={!!errors.immat} placeholder="XX-XXXX-XX" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Chauffeur assigné">
            <TBOSSelect value={chauffeur} onChange={e => setChauffeur(e.target.value)}
              options={DRIVERS} placeholder="Aucun" />
          </TBOSField>
          {selectedType && <TBOSDisplayField label="Capacité" value={selectedType.capacite} />}
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date mise en service">
            <TBOSInput type="date" value={dateMise} onChange={e => setDateMise(e.target.value)} />
          </TBOSField>
          <TBOSField label="Prochaine maintenance">
            <TBOSInput type="date" value={dateMaint} onChange={e => setDateMaint(e.target.value)} />
          </TBOSField>
        </TBOSFormRow>

        {/* État radio */}
        <TBOSField label="État">
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ v: 'actif', l: 'Actif', c: '#22C55E' }, { v: 'maintenance', l: 'Maintenance', c: '#F59E0B' }, { v: 'hors_service', l: 'Hors service', c: '#EF4444' }].map(o => (
              <button key={o.v} onClick={() => setEtat(o.v)} style={{
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 12, fontWeight: 600,
                background: etat === o.v ? `${o.c}15` : 'rgba(255,255,255,0.03)',
                color: etat === o.v ? o.c : '#9CA3AF',
                border: etat === o.v ? `1px solid ${o.c}40` : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 150ms',
              }}>
                {o.l}
              </button>
            ))}
          </div>
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
