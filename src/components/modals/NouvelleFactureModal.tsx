import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { generateNumero } from '@/lib/generateNumero';
import { toast } from 'sonner';

const BLS = [
  { value: 'bl1', label: 'BL-2603-005 — TGCC · 8m³ · 26/03', client: 'TGCC', clientId: 'TGCC', montant: 6800 },
  { value: 'bl2', label: 'BL-2603-006 — Constructions Modernes · 10m³ · 26/03', client: 'Constructions Modernes SA', clientId: 'CMOD', montant: 8500 },
  { value: 'bl3', label: 'BL-2603-007 — BTP Maroc · 6m³ · 25/03', client: 'BTP Maroc SARL', clientId: 'BTPM', montant: 5100 },
];

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
  const [bl, setBl] = useState('');
  const [montantHT, setMontantHT] = useState('');
  const [tva, setTva] = useState('20');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [echeance, setEcheance] = useState('');
  const [mode, setMode] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedBL = BLS.find(b => b.value === bl);

  const handleBLChange = (val: string) => {
    setBl(val);
    const found = BLS.find(b => b.value === val);
    if (found) {
      setMontantHT(String(found.montant));
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setEcheance(d.toISOString().slice(0, 10));
    }
  };

  const montantTTC = useMemo(() => {
    const ht = parseFloat(montantHT);
    const t = parseFloat(tva);
    return ht > 0 ? ht * (1 + t / 100) : 0;
  }, [montantHT, tva]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bl) e.bl = 'Champ requis';
    if (!montantHT || parseFloat(montantHT) <= 0) e.montantHT = 'Valeur doit être positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const facId = await generateNumero('FAC', 'factures');
      const ht = parseFloat(montantHT);
      const tvaRate = parseFloat(tva);
      const ttc = ht * (1 + tvaRate / 100);

      // Insert into factures table
      const { error: insertError } = await supabase
        .from('factures')
        .insert({
          facture_id: facId,
          bl_id: selectedBL?.label?.split(' — ')[0] || 'BL-UNKNOWN',
          client_id: selectedBL?.clientId || 'UNKNOWN',
          client_nom: selectedBL?.client || null,
          formule_id: 'F-B25',
          volume_m3: 8,
          prix_vente_m3: ht / 8,
          total_ht: ht,
          tva_pct: tvaRate,
          total_ttc: ttc,
          montant_ht: ht,
          date_facture: dateEmission,
          date_echeance: echeance || null,
          mode_paiement: mode || null,
          notes: notes || null,
          statut: 'courante',
        });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Facture ${facId} émise — ${selectedBL?.client} · ${ttc.toLocaleString('fr-FR')} DH TTC`,
        source_page: 'creances',
        severite: 'success',
      });

      onCreated?.({ id: facId, bl: selectedBL?.label, client: selectedBL?.client, montantHT: ht, tva: tvaRate, montantTTC: ttc, dateEmission, echeance, mode });
      showFormSuccess(`✓ Facture ${facId} émise — ${selectedBL?.client}`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible de créer la facture'}`);
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setBl(''); setMontantHT(''); setTva('20'); setDateEmission(new Date().toISOString().slice(0, 10));
    setEcheance(''); setMode(''); setNotes(''); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouvelle Facture" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Émettre Facture</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSField label="Bon de livraison" required error={errors.bl}>
          <TBOSSelect value={bl} onChange={e => handleBLChange(e.target.value)} hasError={!!errors.bl}
            options={BLS.map(b => ({ value: b.value, label: b.label }))} placeholder="Sélectionner un BL" />
        </TBOSField>

        {selectedBL && <TBOSDisplayField label="Client" value={selectedBL.client} />}

        <TBOSFormRow cols={3}>
          <TBOSField label="Montant HT (DH)" required error={errors.montantHT}>
            <TBOSInput type="number" value={montantHT} onChange={e => setMontantHT(e.target.value)}
              hasError={!!errors.montantHT} style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="TVA">
            <TBOSSelect value={tva} onChange={e => setTva(e.target.value)} options={TVA_OPTIONS} />
          </TBOSField>
          <TBOSDisplayField label="Montant TTC" value={montantTTC > 0 ? `${montantTTC.toLocaleString('fr-FR')} DH` : '—'} />
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date émission">
            <TBOSInput type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} />
          </TBOSField>
          <TBOSField label="Échéance">
            <TBOSInput type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Mode de paiement">
          <TBOSSelect value={mode} onChange={e => setMode(e.target.value)} options={MODES} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
