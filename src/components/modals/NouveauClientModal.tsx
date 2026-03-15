import { useState, useEffect, useCallback } from 'react';
import { useFormDirty } from '@/hooks/useFormDirty';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { sanitizeClientName, sanitizeInput } from '@/lib/security';

const SEGMENTS = [
  { value: 'Construction', label: 'Construction' },
  { value: 'Promoteur', label: 'Promoteur' },
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Industrie', label: 'Industrie' },
  { value: 'Premium', label: 'Premium' },
  { value: 'Mid-Market', label: 'Mid-Market' },
  { value: 'Nouveau', label: 'Nouveau' },
];

const PAYMENT_TERMS = [
  { value: '30', label: '30 jours' },
  { value: '45', label: '45 jours' },
  { value: '60', label: '60 jours' },
  { value: '0', label: 'Anticipé' },
];

const EMPTY_FORM = { nom: '', segment: '', contact: '', email: '', telephone: '', adresse: '', chantier: '', paiement: '30', notes: '' };

interface Props { open: boolean; onClose: () => void; onCreated?: () => void; }

export function NouveauClientModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isDirty = !!(form.nom || form.segment || form.contact || form.email || form.telephone || form.adresse || form.notes);
  useFormDirty(isDirty);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const phoneValid = (p: string) => /^[+\d\s()\-]{6,20}$/.test(p);

  // Duplicate check on name blur
  const checkDuplicate = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) { setWarnings([]); return; }
    const { data } = await supabase
      .from('clients')
      .select('client_id, nom_client')
      .ilike('nom_client', trimmed)
      .limit(1);
    if (data && data.length > 0) {
      setWarnings(['Un client avec ce nom existe déjà']);
    } else {
      setWarnings(w => w.filter(x => x !== 'Un client avec ce nom existe déjà'));
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!sanitizeClientName(form.nom)) e.nom = 'Champ obligatoire';
    if (!form.segment) e.segment = 'Champ obligatoire';
    // Email: optional, but validate format if provided
    if (form.email.trim() && !emailValid(form.email)) e.email = "Format d'email invalide";
    // Telephone: optional, but validate format if provided
    if (form.telephone.trim() && !phoneValid(form.telephone)) e.telephone = 'Format de téléphone invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const clientId = `CLI-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('clients').insert({
        client_id: clientId,
        nom_client: sanitizeClientName(form.nom),
        segment: form.segment,
        email: form.email.trim().toLowerCase() || null,
        telephone: form.telephone.trim() || null,
        ville: sanitizeInput(form.adresse) || null,
        score_sante: 50,
        statut: 'actif',
      });
      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast.error('Un client avec ce nom ou email existe déjà');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }
      showFormSuccess(`✓ Client créé avec succès`);
      onCreated?.();
      resetAndClose();
    } catch (err: any) {
      console.error('Error creating client:', err);
      toast.error('Erreur lors de la création du client');
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
    setForm(EMPTY_FORM);
    setErrors({}); setWarnings([]); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={handleClose} title="Nouveau Client" footer={
      <>
        <TBOSGhostButton onClick={handleClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Créer le client</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        {warnings.length > 0 && (
          <div role="status" style={{
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
            fontSize: 11, padding: '10px 14px', borderRadius: 6,
            background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
            color: '#EAB308',
          }}>
            {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        <TBOSFormRow>
          <TBOSField label="Nom entreprise" required error={errors.nom}>
            <TBOSInput value={form.nom} onChange={e => set('nom', e.target.value)}
              onBlur={e => checkDuplicate(e.target.value)}
              hasError={!!errors.nom} placeholder="Nom de l'entreprise" maxLength={100} />
          </TBOSField>
          <TBOSField label="Segment" required error={errors.segment}>
            <TBOSSelect value={form.segment} onChange={e => set('segment', e.target.value)} hasError={!!errors.segment}
              options={SEGMENTS} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Contact principal">
          <TBOSInput value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nom du contact" maxLength={100} />
        </TBOSField>

        <TBOSFormRow>
          <TBOSField label="Email" error={errors.email}>
            <TBOSInput type="email" value={form.email} onChange={e => set('email', e.target.value)} hasError={!!errors.email} placeholder="contact@entreprise.ma" maxLength={255} />
          </TBOSField>
          <TBOSField label="Téléphone" error={errors.telephone}>
            <TBOSInput value={form.telephone} onChange={e => set('telephone', e.target.value)} hasError={!!errors.telephone} placeholder="+212 6XX XX XX XX" maxLength={20} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Adresse">
          <TBOSTextarea value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Adresse complète" rows={2} maxLength={500} />
        </TBOSField>

        <TBOSFormRow>
          <TBOSField label="Chantier(s)">
            <TBOSInput value={form.chantier} onChange={e => set('chantier', e.target.value)} placeholder="Nom du chantier" maxLength={200} />
          </TBOSField>
          <TBOSField label="Conditions paiement">
            <TBOSSelect value={form.paiement} onChange={e => set('paiement', e.target.value)} options={PAYMENT_TERMS} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes internes..." maxLength={1000} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
