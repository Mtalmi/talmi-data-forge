import { useState, useMemo, useCallback } from 'react';
import { useFormDirty } from '@/hooks/useFormDirty';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { generateNumero } from '@/lib/generateNumero';
import { toast } from 'sonner';
import { useDeliveredBons } from '@/hooks/useModalData';
import { sanitizeInput } from '@/lib/security';
import { roundCurrency } from '@/utils/rounding';
import { getMoroccoToday } from '@/utils/timezone';

const TVA_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
];

const MODES = [
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'effet', label: 'Effet de commerce' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (f: any) => void; }

export function NouvelleFactureModal({ open, onClose, onCreated }: Props) {
  const { bons } = useDeliveredBons();
  const [bl, setBl] = useState('');
  const [montantHT, setMontantHT] = useState('');
  const [tva, setTva] = useState('20');
  const [dateEmission, setDateEmission] = useState(getMoroccoToday());
  const [echeance, setEcheance] = useState('');
  const [mode, setMode] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isDirty = !!(bl || montantHT || notes || mode);
  useFormDirty(isDirty);

  const selectedBL = bons.find(b => b.value === bl);

  const handleBLChange = (val: string) => {
    setBl(val);
    const found = bons.find(b => b.value === val);
    if (found) {
      setMontantHT(String(found.montant ?? 0));
      // Default échéance: +30 days from today (Morocco)
      const today = new Date(getMoroccoToday() + 'T12:00:00');
      today.setDate(today.getDate() + 30);
      setEcheance(today.toISOString().slice(0, 10));
    }
  };

  // TVA and TTC with roundCurrency — ensures 0.1+0.2 ≠ 0.30000...4
  const tvaAmount = useMemo(() => {
    const ht = parseFloat(montantHT);
    const t = parseFloat(tva);
    return ht > 0 && !isNaN(t) ? roundCurrency(ht * t / 100) : 0;
  }, [montantHT, tva]);

  const montantTTC = useMemo(() => {
    const ht = parseFloat(montantHT);
    return ht > 0 ? roundCurrency(ht + tvaAmount) : 0;
  }, [montantHT, tvaAmount]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bl) e.bl = 'Champ obligatoire';
    const ht = parseFloat(montantHT);
    if (!montantHT || isNaN(ht)) e.montantHT = 'Champ obligatoire';
    else if (ht <= 0) e.montantHT = 'Le montant doit être supérieur à 0';

    if (!echeance) {
      e.echeance = 'Champ obligatoire';
    } else {
      const today = getMoroccoToday();
      if (echeance <= today) {
        e.echeance = "La date d'échéance doit être future";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const facId = await generateNumero('FAC', 'factures');
      const ht = roundCurrency(parseFloat(montantHT));
      const tvaRate = parseFloat(tva);
      const tvaVal = roundCurrency(ht * tvaRate / 100);
      const ttc = roundCurrency(ht + tvaVal);

      const { error: insertError } = await supabase
        .from('factures')
        .insert({
          facture_id: facId,
          bl_id: selectedBL?.value || 'BL-UNKNOWN',
          client_id: selectedBL?.clientId || 'UNKNOWN',
          client_nom: selectedBL?.client || null,
          formule_id: selectedBL?.formuleId || 'F-B25',
          volume_m3: selectedBL?.volume ?? 0,
          prix_vente_m3: selectedBL?.prixM3 ?? roundCurrency(ht / Math.max(1, selectedBL?.volume ?? 1)),
          total_ht: ht,
          tva_pct: tvaRate,
          total_ttc: ttc,
          montant_ht: ht,
          date_facture: dateEmission,
          date_echeance: echeance || null,
          mode_paiement: mode || null,
          notes: sanitizeInput(notes) || null,
          statut: 'courante',
        });

      if (insertError) throw insertError;

      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Facture ${facId} émise — ${selectedBL?.client ?? 'Client'} · ${ttc.toLocaleString('fr-FR')} DH TTC`,
        source_page: 'creances',
        severite: 'success',
      });

      onCreated?.({ id: facId, bl: selectedBL?.label, client: selectedBL?.client, montantHT: ht, tva: tvaRate, montantTTC: ttc, dateEmission, echeance, mode });
      showFormSuccess(`✓ Facture ${facId} émise avec succès`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error("Erreur lors de l'émission de la facture");
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
    setBl(''); setMontantHT(''); setTva('20'); setDateEmission(getMoroccoToday());
    setEcheance(''); setMode(''); setNotes(''); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={handleClose} title="Nouvelle Facture" footer={
      <>
        <TBOSGhostButton onClick={handleClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Émettre la facture</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSField label="Bon de livraison" required error={errors.bl}>
          <TBOSSelect value={bl} onChange={e => handleBLChange(e.target.value)} hasError={!!errors.bl}
            options={bons.map(b => ({ value: b.value, label: b.label }))} placeholder={bons.length === 0 ? 'Aucun BL livré disponible' : 'Sélectionner un BL'} />
        </TBOSField>

        {selectedBL && <TBOSDisplayField label="Client" value={selectedBL.client ?? '—'} />}

        <TBOSFormRow cols={3}>
          <TBOSField label="Montant HT (DH)" required error={errors.montantHT}>
            <TBOSInput type="number" min="1" value={montantHT} onChange={e => setMontantHT(e.target.value)}
              hasError={!!errors.montantHT} style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="TVA">
            <TBOSSelect value={tva} onChange={e => setTva(e.target.value)} options={TVA_OPTIONS} />
          </TBOSField>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TBOSDisplayField label="TVA (DH)" value={tvaAmount > 0 ? `${tvaAmount.toLocaleString('fr-FR')} DH` : '—'} />
            <TBOSDisplayField label="Montant TTC" value={montantTTC > 0 ? `${montantTTC.toLocaleString('fr-FR')} DH` : '—'} />
          </div>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date émission">
            <TBOSInput type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} />
          </TBOSField>
          <TBOSField label="Échéance" required error={errors.echeance}>
            <TBOSInput type="date" value={echeance} onChange={e => setEcheance(e.target.value)} hasError={!!errors.echeance}
              min={getMoroccoToday()} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Mode de paiement">
          <TBOSSelect value={mode} onChange={e => setMode(e.target.value)} options={MODES} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." maxLength={500} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
