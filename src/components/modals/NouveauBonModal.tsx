import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatNumber } from '@/utils/formatters';

const CLIENTS = [
  { value: 'CLI-TGCC05', label: 'TGCC' },
  { value: 'CLI-CM01', label: 'Constructions Modernes SA' },
  { value: 'CLI-BTP02', label: 'BTP Maroc SARL' },
  { value: 'CLI-SRC04', label: 'Saudi Readymix' },
  { value: 'CLI-CBS03', label: 'Ciments & Béton du Sud' },
  { value: 'CLI-SBT06', label: 'Sigma Bâtiment' },
];

const FORMULES = [
  { value: 'F-B20', label: 'F-B20 (20 MPa)', price: 750 },
  { value: 'F-B25', label: 'F-B25 (25 MPa)', price: 850 },
  { value: 'F-B30', label: 'F-B30 (30 MPa)', price: 980 },
  { value: 'F-B35', label: 'F-B35 (35 MPa)', price: 1100 },
];

const CRENEAUX = [
  { value: 'matin', label: 'Matin 06h-12h' },
  { value: 'aprem', label: 'Après-midi 12h-18h' },
];

const TRUCKS = [
  { value: 'T-04', label: 'T-04 — Disponible' },
  { value: 'T-07', label: 'T-07 — Disponible' },
  { value: 'T-12', label: 'T-12 — Disponible' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (bon: any) => void; }

export function NouveauBonModal({ open, onClose, onCreated }: Props) {
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

  const selectedFormule = FORMULES.find(f => f.value === formule);
  const vol = parseFloat(volume) || 0;
  const prixM3 = selectedFormule?.price || 0;
  const totalHT = vol * prixM3;

  const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Champ requis';
    if (!sanitize(chantier)) e.chantier = 'Champ requis';
    if (!formule) e.formule = 'Champ requis';
    const v = parseFloat(volume);
    if (!volume || isNaN(v)) e.volume = 'Champ requis';
    else if (v <= 0) e.volume = 'Valeur doit être positive';
    else if (v > 10000) e.volume = 'Volume max 10 000 m³';
    if (!dateLiv) e.dateLiv = 'Champ requis';
    if (!creneau) e.creneau = 'Champ requis';
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
      const clientLabel = CLIENTS.find(c => c.value === client)?.label || client;
      const v = parseFloat(volume);

      const { error } = await supabase.from('bons_commande').insert({
        bc_id: bcId,
        client_id: client,
        formule_id: formule,
        volume_m3: v,
        prix_vente_m3: prixM3,
        total_ht: v * prixM3,
        date_livraison_souhaitee: dateLiv,
        heure_livraison_souhaitee: creneau === 'matin' ? '08:00' : '14:00',
        adresse_livraison: sanitize(chantier) || null,
        contact_chantier: sanitize(contact) || null,
        pompe_requise: pompe,
        notes: sanitize(notes) || null,
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

      onCreated?.({ id: bcId, client: clientLabel, chantier: sanitize(chantier), formule, volume: v, dateLiv, creneau, toupie, pompe, statut: 'Planification' });
      showFormSuccess(`✓ Bon ${bcId} créé — ${clientLabel}`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating bon:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible de créer le bon'}`);
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setClient(''); setChantier(''); setFormule(''); setVolume(''); setDateLiv('');
    setCreneau(''); setToupie(''); setChauffeur(''); setContact(''); setPompe(false);
    setNotes(''); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Bon de Commande" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Créer Bon</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Client" required error={errors.client}>
            <TBOSSelect value={client} onChange={e => setClient(e.target.value)} hasError={!!errors.client}
              options={CLIENTS} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Chantier" required error={errors.chantier}>
            <TBOSInput value={chantier} onChange={e => setChantier(e.target.value)} hasError={!!errors.chantier} placeholder="Nom du chantier" maxLength={200} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Formule" required error={errors.formule}>
            <TBOSSelect value={formule} onChange={e => setFormule(e.target.value)} hasError={!!errors.formule}
              options={FORMULES.map(f => ({ value: f.value, label: f.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Volume (m³)" required error={errors.volume}>
            <TBOSInput type="number" step="0.5" min="0.1" max="10000" value={volume} onChange={e => setVolume(e.target.value)}
              hasError={!!errors.volume} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Date livraison" required error={errors.dateLiv}>
            <TBOSInput type="date" value={dateLiv} onChange={e => setDateLiv(e.target.value)} hasError={!!errors.dateLiv}
              min={new Date().toISOString().split('T')[0]} />
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
              options={TRUCKS} placeholder="Auto-assignation" />
          </TBOSField>
          <TBOSField label="Chauffeur">
            <TBOSInput value={chauffeur} onChange={e => setChauffeur(e.target.value)} placeholder="Auto" maxLength={100} />
          </TBOSField>
          <TBOSField label="Pompe requise">
            <button onClick={() => setPompe(!pompe)} style={{
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
