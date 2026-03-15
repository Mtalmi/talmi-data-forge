import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MATERIAUX = [
  { value: 'ciment', label: 'Ciment', unit: 'kg' },
  { value: 'sable', label: 'Sable', unit: 'kg' },
  { value: 'gravette', label: 'Gravette', unit: 'm³' },
  { value: 'adjuvant', label: 'Adjuvant', unit: 'L' },
  { value: 'eau', label: 'Eau', unit: 'L' },
];

const OPERATORS = [
  { value: 'youssef', label: 'Youssef M.' },
  { value: 'karim', label: 'Karim B.' },
  { value: 'ahmed', label: 'Ahmed R.' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (mvt: any) => void; }

export function NouveauMouvementModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<'entree' | 'sortie'>('entree');
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [responsable, setResponsable] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedMat = MATERIAUX.find(m => m.value === materiau);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!materiau) e.materiau = 'Champ requis';
    if (!quantite || parseFloat(quantite) <= 0) e.quantite = 'Valeur doit être positive';
    if (!responsable) e.responsable = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const matLabel = selectedMat?.label || materiau;
      const qty = parseFloat(quantite);

      // Get current stock level
      const { data: stockRow } = await supabase
        .from('stocks')
        .select('id, quantite_actuelle')
        .eq('materiau', matLabel)
        .maybeSingle();

      const currentQty = stockRow?.quantite_actuelle || 0;
      const newQty = type === 'entree' ? currentQty + qty : Math.max(0, currentQty - qty);

      // Insert mouvement
      const { error: mvtError } = await supabase
        .from('mouvements_stock')
        .insert({
          materiau: matLabel,
          type_mouvement: type === 'entree' ? 'reception' : 'consommation',
          quantite: qty,
          quantite_avant: currentQty,
          quantite_apres: newQty,
          fournisseur: fournisseur || null,
          notes: notes || null,
        });

      if (mvtError) throw mvtError;

      // Update stock level
      if (stockRow?.id) {
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            quantite_actuelle: newQty,
            updated_at: new Date().toISOString(),
            ...(type === 'entree' ? { derniere_reception_at: new Date().toISOString() } : {}),
          })
          .eq('id', stockRow.id);

        if (updateError) throw updateError;
      }

      // Log activity
      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Mouvement ${type === 'entree' ? 'entrée' : 'sortie'} enregistré — ${matLabel} ${qty} ${selectedMat?.unit}`,
        source_page: 'stocks',
        severite: 'info',
      });

      const mvt = { type, materiau: matLabel, quantite: qty, fournisseur, reference, date, responsable, notes };
      onCreated?.(mvt);
      showFormSuccess(`✓ Mouvement ${type === 'entree' ? 'entrée' : 'sortie'} enregistré — ${matLabel} ${qty} ${selectedMat?.unit}`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error saving stock movement:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible d\'enregistrer le mouvement'}`);
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setType('entree'); setMateriau(''); setQuantite(''); setFournisseur(''); setReference('');
    setDate(new Date().toISOString().slice(0, 10)); setResponsable(''); setNotes('');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Mouvement de Stock" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Enregistrer</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['entree', 'sortie'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 6, cursor: 'pointer',
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 12, fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              background: type === t ? (t === 'entree' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.03)',
              color: type === t ? (t === 'entree' ? '#22C55E' : '#EF4444') : '#9CA3AF',
              border: `1px solid ${type === t ? (t === 'entree' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 150ms',
            }}>
              {t === 'entree' ? '↓ ENTRÉE' : '↑ SORTIE'}
            </button>
          ))}
        </div>

        <TBOSFormRow>
          <TBOSField label="Matériau" required error={errors.materiau}>
            <TBOSSelect value={materiau} onChange={e => setMateriau(e.target.value)} hasError={!!errors.materiau}
              options={MATERIAUX.map(m => ({ value: m.value, label: `${m.label} (${m.unit})` }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label={`Quantité${selectedMat ? ` (${selectedMat.unit})` : ''}`} required error={errors.quantite}>
            <TBOSInput type="number" step="0.1" value={quantite} onChange={e => setQuantite(e.target.value)}
              hasError={!!errors.quantite} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label={type === 'entree' ? 'Fournisseur' : 'Destination'}>
            <TBOSInput value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder={type === 'entree' ? 'Nom fournisseur' : 'Destination'} />
          </TBOSField>
          <TBOSField label="Référence">
            <TBOSInput value={reference} onChange={e => setReference(e.target.value)} placeholder="N° BL ou référence interne" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date">
            <TBOSInput type="date" value={date} onChange={e => setDate(e.target.value)} />
          </TBOSField>
          <TBOSField label="Responsable" required error={errors.responsable}>
            <TBOSSelect value={responsable} onChange={e => setResponsable(e.target.value)} hasError={!!errors.responsable}
              options={OPERATORS} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
