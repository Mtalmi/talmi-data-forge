import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const CLIENTS = [
  { value: 'tgcc', label: 'TGCC' },
  { value: 'cm', label: 'Constructions Modernes SA' },
  { value: 'btp', label: 'BTP Maroc SARL' },
  { value: 'saudi', label: 'Saudi Readymix' },
  { value: 'cbs', label: 'Ciments & Béton du Sud' },
  { value: 'sigma', label: 'Sigma Bâtiment' },
];

const FORMULES = [
  { value: 'F-B20', label: 'F-B20 (20 MPa)', price: 750 },
  { value: 'F-B25', label: 'F-B25 (25 MPa)', price: 850 },
  { value: 'F-B30', label: 'F-B30 (30 MPa)', price: 980 },
  { value: 'F-B35', label: 'F-B35 (35 MPa)', price: 1100 },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (devis: any) => void; }

export function NouveauDevisModal({ open, onClose, onCreated }: Props) {
  const [client, setClient] = useState('');
  const [chantier, setChantier] = useState('');
  const [formule, setFormule] = useState('');
  const [volume, setVolume] = useState('');
  const [prixUnit, setPrixUnit] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedFormule = FORMULES.find(f => f.value === formule);
  const effectivePrice = prixUnit || String(selectedFormule?.price || '');
  const total = useMemo(() => {
    const v = parseFloat(volume);
    const p = parseFloat(effectivePrice);
    return v > 0 && p > 0 ? v * p : 0;
  }, [volume, effectivePrice]);

  const handleFormuleChange = (val: string) => {
    setFormule(val);
    const f = FORMULES.find(x => x.value === val);
    if (f) setPrixUnit(String(f.price));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Champ requis';
    if (!chantier.trim()) e.chantier = 'Champ requis';
    if (!formule) e.formule = 'Champ requis';
    if (!volume || parseFloat(volume) <= 0) e.volume = 'Valeur doit être positive';
    if (!dateLivraison) e.dateLivraison = 'Champ requis';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`) as HTMLElement;
      first?.focus();
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const id = `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const devis = {
      id, client: CLIENTS.find(c => c.value === client)?.label, chantier, formule, volume: parseFloat(volume),
      prix_unitaire: parseFloat(effectivePrice), total, date_livraison: dateLivraison, notes, statut: 'Brouillon',
      created_at: new Date().toISOString(),
    };
    onCreated?.(devis);
    showFormSuccess(`✓ Devis ${id} créé avec succès`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setClient(''); setChantier(''); setFormule(''); setVolume(''); setPrixUnit('');
    setDateLivraison(''); setNotes(''); setErrors({}); setLoading(false);
    onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Devis" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={!client || !chantier || !formule || !volume || !dateLivraison}>
          Créer Devis
        </TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Client" required error={errors.client}>
            <TBOSSelect data-field="client" value={client} onChange={e => setClient(e.target.value)}
              hasError={!!errors.client} options={CLIENTS} placeholder="Sélectionner un client" />
          </TBOSField>
          <TBOSField label="Chantier" required error={errors.chantier}>
            <TBOSInput data-field="chantier" value={chantier} onChange={e => setChantier(e.target.value)}
              hasError={!!errors.chantier} placeholder="Nom du chantier ou adresse" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Formule" required error={errors.formule}>
            <TBOSSelect data-field="formule" value={formule} onChange={e => handleFormuleChange(e.target.value)}
              hasError={!!errors.formule} options={FORMULES.map(f => ({ value: f.value, label: f.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Volume (m³)" required error={errors.volume}>
            <TBOSInput data-field="volume" type="number" step="0.5" min="0.1" value={volume}
              onChange={e => setVolume(e.target.value)} hasError={!!errors.volume} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Prix unitaire (DH/m³)">
            <TBOSInput type="number" value={effectivePrice} onChange={e => setPrixUnit(e.target.value)} style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSDisplayField label="Total HT" value={total > 0 ? `${total.toLocaleString('fr-FR')} DH` : '—'} />
          <TBOSField label="Date livraison souhaitée" required error={errors.dateLivraison}>
            <TBOSInput data-field="dateLivraison" type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
              hasError={!!errors.dateLivraison} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes internes..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
