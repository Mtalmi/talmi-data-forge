import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormDirty } from '@/hooks/useFormDirty';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatNumber } from '@/utils/formatters';
import { useClients } from '@/hooks/useModalData';
import { sanitizeInput } from '@/lib/security';
import { roundCurrency } from '@/utils/rounding';
import { getMoroccoToday } from '@/utils/timezone';

const CRENEAUX = [
  { value: 'matin', label: 'Matin 06h-12h' },
  { value: 'aprem', label: 'Après-midi 12h-18h' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (bon: any) => void; }

export function NouveauBonModal({ open, onClose, onCreated }: Props) {
  const { clients } = useClients();
  const [formules, setFormules] = useState<{ value: string; label: string; price: number }[]>([]);
  const [trucks, setTrucks] = useState<{ value: string; label: string }[]>([]);
  const [client, setClient] = useState('');
  const [chantier, setChantier] = useState('');
  const [formule, setFormule] = useState('');
  const [volume, setVolume] = useState('');
  const [dateLiv, setDateLiv] = useState('');
  const [creneau, setCreneau] = useState('');
  const [toupie, setToupie] = useState('');
  const [chauffeur, setChauffeur] = useState('');
  const [contact, setContact] = useState('');
  const [pompe, setPompe] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isDirty = !!(client || chantier || formule || volume || notes || contact);
  useFormDirty(isDirty);

  // Load formules + trucks from DB
  useEffect(() => {
    if (!open) return;
    setDateLiv(getMoroccoToday());
    (async () => {
      const [formulesRes, trucksRes] = await Promise.all([
        supabase.from('formules_theoriques').select('formule_id, designation'),
        supabase.from('flotte').select('id_camion, immatriculation, statut').eq('statut', 'actif'),
      ]);

      if (formulesRes.data?.length) {
        setFormules(formulesRes.data.map((f: any) => ({
          value: f.formule_id,
          label: `${f.formule_id} — ${f.designation || ''}`,
          price: 850, // default, overridden by devis pricing
        })));
      } else {
        setFormules([
          { value: 'F-B20', label: 'F-B20 (20 MPa)', price: 750 },
          { value: 'F-B25', label: 'F-B25 (25 MPa)', price: 850 },
          { value: 'F-B30', label: 'F-B30 (30 MPa)', price: 980 },
          { value: 'F-B35', label: 'F-B35 (35 MPa)', price: 1100 },
        ]);
      }

      if (trucksRes.data?.length) {
        setTrucks(trucksRes.data.map((t: any) => ({
          value: t.id_camion,
          label: `${t.id_camion} — ${t.immatriculation || 'Disponible'}`,
        })));
      }
    })();
  }, [open]);

  const selectedFormule = formules.find(f => f.value === formule);
  const vol = parseFloat(volume) || 0;
  const prixM3 = selectedFormule?.price || 0;
  const totalHT = roundCurrency(vol * prixM3);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Champ obligatoire';
    if (!sanitizeInput(chantier)) e.chantier = 'Champ obligatoire';
    if (!formule) e.formule = 'Champ obligatoire';
    const v = parseFloat(volume);
    if (!volume || isNaN(v)) e.volume = 'Champ obligatoire';
    else if (v <= 0) e.volume = 'Le volume doit être supérieur à 0';
    if (!dateLiv) e.dateLiv = 'Champ obligatoire';
    if (!creneau) e.creneau = 'Champ obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const now = new Date();
      const bcId = `BC-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const clientLabel = clients.find(c => c.value === client)?.label || client;
      const v = parseFloat(volume);
      const ht = roundCurrency(v * prixM3);

      const { error } = await supabase.from('bons_commande').insert({
        bc_id: bcId,
        client_id: client,
        formule_id: formule,
        volume_m3: v,
        prix_vente_m3: prixM3,
        total_ht: ht,
        date_livraison_souhaitee: dateLiv,
        heure_livraison_souhaitee: creneau === 'matin' ? '08:00' : '14:00',
        adresse_livraison: sanitizeInput(chantier) || null,
        contact_chantier: sanitizeInput(contact) || null,
        pompe_requise: pompe,
        notes: sanitizeInput(notes) || null,
        statut: 'planification',
        prix_verrouille: false,
      });

      if (error) throw error;

      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Bon ${bcId} créé — ${clientLabel} · ${formule} · ${formatNumber(v, { decimals: 1 })} m³`,
        source_page: 'bons',
        severite: 'info',
      }).then(() => {});

      onCreated?.({ id: bcId, client: clientLabel, chantier: sanitizeInput(chantier), formule, volume: v, dateLiv, creneau, toupie, pompe, statut: 'Planification' });
      showFormSuccess(`✓ Bon ${bcId} créé avec succès`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating bon:', error);
      toast.error('Erreur lors de la création du bon');
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
    setClient(''); setChantier(''); setFormule(''); setVolume(''); setDateLiv('');
    setCreneau(''); setToupie(''); setChauffeur(''); setContact(''); setPompe(false);
    setNotes(''); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={handleClose} title="Nouveau Bon de Commande" footer={
      <>
        <TBOSGhostButton onClick={handleClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Créer le bon</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Client" required error={errors.client}>
            <TBOSSelect value={client} onChange={e => setClient(e.target.value)} hasError={!!errors.client}
              options={clients} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Chantier" required error={errors.chantier}>
            <TBOSInput value={chantier} onChange={e => setChantier(e.target.value)} hasError={!!errors.chantier} placeholder="Nom du chantier" maxLength={200} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Formule" required error={errors.formule}>
            <TBOSSelect value={formule} onChange={e => setFormule(e.target.value)} hasError={!!errors.formule}
              options={formules.map(f => ({ value: f.value, label: f.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Volume (m³)" required error={errors.volume}>
            <TBOSInput type="number" step="0.5" min="0.1" value={volume} onChange={e => setVolume(e.target.value)}
              hasError={!!errors.volume} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Date livraison" required error={errors.dateLiv}>
            <TBOSInput type="date" value={dateLiv} onChange={e => setDateLiv(e.target.value)} hasError={!!errors.dateLiv}
              min={getMoroccoToday()} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSDisplayField label="Total HT" value={totalHT > 0 ? `${totalHT.toLocaleString('fr-FR')} DH` : '—'} />
          <TBOSField label="Créneau" required error={errors.creneau}>
            <TBOSSelect value={creneau} onChange={e => setCreneau(e.target.value)} hasError={!!errors.creneau}
              options={CRENEAUX} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Toupie">
            <TBOSSelect value={toupie} onChange={e => setToupie(e.target.value)}
              options={trucks} placeholder="Auto-assignation" />
          </TBOSField>
          <TBOSField label="Chauffeur">
            <TBOSInput value={chauffeur} onChange={e => setChauffeur(e.target.value)} placeholder="Auto" maxLength={100} />
          </TBOSField>
          <TBOSField label="Pompe requise">
            <button type="button" onClick={() => setPompe(!pompe)} style={{
              padding: '10px 14px', borderRadius: 6, cursor: 'pointer', width: '100%', textAlign: 'left',
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 13,
              background: pompe ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.03)',
              color: pompe ? '#D4A843' : '#9CA3AF',
              border: pompe ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {pompe ? '✓ Pompe requise' : '○ Pas de pompe'}
            </button>
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Contact chantier">
          <TBOSInput value={contact} onChange={e => setContact(e.target.value)} placeholder="Nom + téléphone" maxLength={200} />
        </TBOSField>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions spéciales..." maxLength={500} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
