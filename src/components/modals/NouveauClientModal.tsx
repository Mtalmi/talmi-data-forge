import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const SEGMENTS = [
  { value: 'Premium', label: 'Premium' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Nouveau', label: 'Nouveau' },
];

const PAYMENT_TERMS = [
  { value: '30', label: '30 jours' },
  { value: '45', label: '45 jours' },
  { value: '60', label: '60 jours' },
  { value: '0', label: 'Anticipé' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: () => void; }

export function NouveauClientModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ nom: '', segment: '', contact: '', email: '', telephone: '', adresse: '', chantier: '', paiement: '30', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Champ requis';
    if (!form.segment) e.segment = 'Champ requis';
    if (!form.contact.trim()) e.contact = 'Champ requis';
    if (!form.email.trim()) e.email = 'Champ requis';
    else if (!emailValid(form.email)) e.email = 'Format email invalide';
    if (!form.telephone.trim()) e.telephone = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const clientId = `CLI-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('clients').insert({
        client_id: clientId,
        nom_client: form.nom,
        segment: form.segment,
        email: form.email,
        telephone: form.telephone,
        ville: form.adresse || null,
        score_sante: 50,
        statut: 'actif',
      });
      if (error) throw error;
      showFormSuccess(`✓ Client "${form.nom}" créé avec succès — ${clientId}`);
      onCreated?.();
      resetAndClose();
    } catch {
      setLoading(false);
      showFormSuccess('❌ Erreur lors de la création');
    }
  };

  const resetAndClose = () => {
    setForm({ nom: '', segment: '', contact: '', email: '', telephone: '', adresse: '', chantier: '', paiement: '30', notes: '' });
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Client" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Créer Client</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Nom entreprise" required error={errors.nom}>
            <TBOSInput value={form.nom} onChange={e => set('nom', e.target.value)} hasError={!!errors.nom} placeholder="Nom de l'entreprise" />
          </TBOSField>
          <TBOSField label="Segment" required error={errors.segment}>
            <TBOSSelect value={form.segment} onChange={e => set('segment', e.target.value)} hasError={!!errors.segment}
              options={SEGMENTS} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Contact principal" required error={errors.contact}>
          <TBOSInput value={form.contact} onChange={e => set('contact', e.target.value)} hasError={!!errors.contact} placeholder="Nom du contact" />
        </TBOSField>

        <TBOSFormRow>
          <TBOSField label="Email" required error={errors.email}>
            <TBOSInput type="email" value={form.email} onChange={e => set('email', e.target.value)} hasError={!!errors.email} placeholder="contact@entreprise.ma" />
          </TBOSField>
          <TBOSField label="Téléphone" required error={errors.telephone}>
            <TBOSInput value={form.telephone} onChange={e => set('telephone', e.target.value)} hasError={!!errors.telephone} placeholder="+212 6XX XX XX XX" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Adresse">
          <TBOSTextarea value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Adresse complète" rows={2} />
        </TBOSField>

        <TBOSFormRow>
          <TBOSField label="Chantier(s)">
            <TBOSInput value={form.chantier} onChange={e => set('chantier', e.target.value)} placeholder="Nom du chantier" />
          </TBOSField>
          <TBOSField label="Conditions paiement">
            <TBOSSelect value={form.paiement} onChange={e => set('paiement', e.target.value)} options={PAYMENT_TERMS} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes internes..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
