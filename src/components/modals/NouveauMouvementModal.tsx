import { useState, useEffect, useCallback } from 'react';
import { useFormDirty } from '@/hooks/useFormDirty';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeInput } from '@/lib/security';
import { getMoroccoToday } from '@/utils/timezone';

interface Props { open: boolean; onClose: () => void; onCreated?: (mvt: any) => void; }

export function NouveauMouvementModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState<'entree' | 'sortie'>('entree');
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(getMoroccoToday());
  const [responsable, setResponsable] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic data from DB
  const [materiaux, setMateriaux] = useState<{ value: string; label: string; unit: string }[]>([]);
  const [operators, setOperators] = useState<{ value: string; label: string }[]>([]);

  const isDirty = !!(materiau || quantite || fournisseur || reference || notes);
  useFormDirty(isDirty);

  // Load materiaux from stocks table + operators from profiles
  useEffect(() => {
    if (!open) return;
    setDate(getMoroccoToday());
    (async () => {
      const [stocksRes, profilesRes] = await Promise.all([
        supabase.from('stocks').select('materiau, unite').order('materiau'),
        supabase.from('profiles').select('user_id, full_name').order('full_name'),
      ]);

      if (stocksRes.data?.length) {
        const seen = new Set<string>();
        setMateriaux(stocksRes.data.filter((s: any) => {
          if (seen.has(s.materiau)) return false;
          seen.add(s.materiau);
          return true;
        }).map((s: any) => ({
          value: s.materiau,
          label: `${s.materiau} (${s.unite || 'kg'})`,
          unit: s.unite || 'kg',
        })));
      } else {
        // Fallback if stocks table empty
        setMateriaux([
          { value: 'Ciment', label: 'Ciment (kg)', unit: 'kg' },
          { value: 'Sable', label: 'Sable (kg)', unit: 'kg' },
          { value: 'Gravette', label: 'Gravette (m³)', unit: 'm³' },
          { value: 'Adjuvant', label: 'Adjuvant (L)', unit: 'L' },
          { value: 'Eau', label: 'Eau (L)', unit: 'L' },
        ]);
      }

      if (profilesRes.data) {
        setOperators(profilesRes.data
          .filter((p: any) => p.full_name)
          .map((p: any) => ({ value: p.user_id, label: p.full_name }))
        );
      }
    })();
  }, [open]);

  const selectedMat = materiaux.find(m => m.value === materiau);

  const validate = () => {
    const e: Record<string, string> = {};
    const w: string[] = [];
    if (!materiau) e.materiau = 'Champ obligatoire';
    const qty = parseFloat(quantite);
    if (!quantite || isNaN(qty)) e.quantite = 'Champ obligatoire';
    else if (qty <= 0) e.quantite = 'La quantité doit être supérieure à 0';
    if (!responsable) e.responsable = 'Champ obligatoire';
    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const matLabel = materiau; // Already the DB label from stocks table
      const qty = parseFloat(quantite);

      const { data: stockRow } = await supabase
        .from('stocks')
        .select('id, quantite_actuelle')
        .eq('materiau', matLabel)
        .maybeSingle();

      const currentQty = (stockRow as any)?.quantite_actuelle ?? 0;

      // Sortie > stock: warn but allow (user confirmed)
      if (type === 'sortie' && qty > currentQty) {
        const confirmed = window.confirm(
          `Stock insuffisant — disponible : ${currentQty} ${selectedMat?.unit || ''}.\nQuantité demandée : ${qty} ${selectedMat?.unit || ''}.\n\nVoulez-vous continuer quand même ?`
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }

      const newQty = Math.max(0, type === 'entree' ? currentQty + qty : currentQty - qty);

      const { error: mvtError } = await supabase
        .from('mouvements_stock')
        .insert({
          materiau: matLabel,
          type_mouvement: type === 'entree' ? 'reception' : 'consommation',
          quantite: qty,
          quantite_avant: currentQty,
          quantite_apres: newQty,
          fournisseur: sanitizeInput(fournisseur) || null,
          notes: sanitizeInput(notes) || null,
        });

      if (mvtError) throw mvtError;

      if ((stockRow as any)?.id) {
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            quantite_actuelle: newQty,
            updated_at: new Date().toISOString(),
            ...(type === 'entree' ? { derniere_reception_at: new Date().toISOString() } : {}),
          })
          .eq('id', (stockRow as any).id);

        if (updateError) throw updateError;
      }

      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Mouvement ${type === 'entree' ? 'entrée' : 'sortie'} enregistré — ${matLabel} ${qty} ${selectedMat?.unit || ''}`,
        source_page: 'stocks',
        severite: type === 'sortie' && newQty < currentQty * 0.2 ? 'warning' : 'info',
      }).then(() => {});

      const mvt = { type, materiau: matLabel, quantite: qty, fournisseur: sanitizeInput(fournisseur), reference: sanitizeInput(reference), date, responsable, notes: sanitizeInput(notes) };
      onCreated?.(mvt);
      showFormSuccess('✓ Mouvement enregistré avec succès');
      resetAndClose();
    } catch (error: any) {
      console.error('Error saving stock movement:', error);
      toast.error('Erreur lors de l\'enregistrement du mouvement');
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('Modifications non sauvegardées. Voulez-vous quitter ?');
      if (!confirmed) return;
    }
    resetAndClose();
  }, [isDirty]);

  const resetAndClose = () => {
    setType('entree'); setMateriau(''); setQuantite(''); setFournisseur(''); setReference('');
    setDate(getMoroccoToday()); setResponsable(''); setNotes('');
    setErrors({}); setWarnings([]); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={handleClose} title="Nouveau Mouvement de Stock" footer={
      <>
        <TBOSGhostButton onClick={handleClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Enregistrer</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <div style={{ display: 'flex', gap: 8 }} role="radiogroup" aria-label="Type de mouvement">
          {(['entree', 'sortie'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} type="button" role="radio" aria-checked={type === t} style={{
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
              options={materiaux.map(m => ({ value: m.value, label: m.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label={`Quantité${selectedMat ? ` (${selectedMat.unit})` : ''}`} required error={errors.quantite}>
            <TBOSInput type="number" step="0.1" min="0.1" value={quantite} onChange={e => setQuantite(e.target.value)}
              hasError={!!errors.quantite} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label={type === 'entree' ? 'Fournisseur' : 'Destination'}>
            <TBOSInput value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder={type === 'entree' ? 'Nom fournisseur' : 'Destination'} maxLength={200} />
          </TBOSField>
          <TBOSField label="Référence">
            <TBOSInput value={reference} onChange={e => setReference(e.target.value)} placeholder="N° BL ou référence interne" maxLength={100} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date">
            <TBOSInput type="date" value={date} onChange={e => setDate(e.target.value)} />
          </TBOSField>
          <TBOSField label="Responsable" required error={errors.responsable}>
            <TBOSSelect value={responsable} onChange={e => setResponsable(e.target.value)} hasError={!!errors.responsable}
              options={operators} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." maxLength={500} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
