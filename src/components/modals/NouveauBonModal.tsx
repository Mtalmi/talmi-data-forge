import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const CLIENTS = [
  { value: 'tgcc', label: 'TGCC' },
  { value: 'cm', label: 'Constructions Modernes SA' },
  { value: 'btp', label: 'BTP Maroc SARL' },
  { value: 'saudi', label: 'Saudi Readymix' },
];

const FORMULES = [
  { value: 'F-B20', label: 'F-B20' },
  { value: 'F-B25', label: 'F-B25' },
  { value: 'F-B30', label: 'F-B30' },
  { value: 'F-B35', label: 'F-B35' },
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Champ requis';
    if (!chantier.trim()) e.chantier = 'Champ requis';
    if (!formule) e.formule = 'Champ requis';
    if (!volume || parseFloat(volume) <= 0) e.volume = 'Valeur doit être positive';
    if (!dateLiv) e.dateLiv = 'Champ requis';
    if (!creneau) e.creneau = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const now = new Date();
    const blId = `BL-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    onCreated?.({ id: blId, client: CLIENTS.find(c => c.value === client)?.label, chantier, formule, volume: parseFloat(volume), dateLiv, creneau, toupie, pompe, statut: 'Planification' });
    showFormSuccess(`✓ Bon ${blId} créé — ${CLIENTS.find(c => c.value === client)?.label}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setClient(''); setChantier(''); setFormule(''); setVolume(''); setDateLiv('');
    setCreneau(''); setToupie(''); setChauffeur(''); setContact(''); setPompe(false);
    setNotes(''); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Bon de Livraison" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Créer Bon</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Client" required error={errors.client}>
            <TBOSSelect value={client} onChange={e => setClient(e.target.value)} hasError={!!errors.client}
              options={CLIENTS} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Chantier" required error={errors.chantier}>
            <TBOSInput value={chantier} onChange={e => setChantier(e.target.value)} hasError={!!errors.chantier} placeholder="Nom du chantier" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Formule" required error={errors.formule}>
            <TBOSSelect value={formule} onChange={e => setFormule(e.target.value)} hasError={!!errors.formule}
              options={FORMULES} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Volume (m³)" required error={errors.volume}>
            <TBOSInput type="number" step="0.5" value={volume} onChange={e => setVolume(e.target.value)}
              hasError={!!errors.volume} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Date livraison" required error={errors.dateLiv}>
            <TBOSInput type="date" value={dateLiv} onChange={e => setDateLiv(e.target.value)} hasError={!!errors.dateLiv} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Créneau" required error={errors.creneau}>
            <TBOSSelect value={creneau} onChange={e => setCreneau(e.target.value)} hasError={!!errors.creneau}
              options={CRENEAUX} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Toupie">
            <TBOSSelect value={toupie} onChange={e => setToupie(e.target.value)}
              options={TRUCKS} placeholder="Auto-assignation" />
          </TBOSField>
          <TBOSField label="Chauffeur">
            <TBOSInput value={chauffeur} onChange={e => setChauffeur(e.target.value)} placeholder="Auto" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Contact chantier">
            <TBOSInput value={contact} onChange={e => setContact(e.target.value)} placeholder="Nom + téléphone" />
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

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions spéciales..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
