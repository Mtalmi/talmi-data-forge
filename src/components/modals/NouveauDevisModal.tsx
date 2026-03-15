import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
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

const SIGMA_CLIENT_ID = 'CLI-SBT06';

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

  const isSigmaSelected = client === SIGMA_CLIENT_ID;

  const handleFormuleChange = (val: string) => {
    setFormule(val);
    const f = FORMULES.find(x => x.value === val);
    if (f) setPrixUnit(String(f.price));
  };

  const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Champ requis';
    if (!sanitize(chantier)) e.chantier = 'Champ requis';
    if (!formule) e.formule = 'Champ requis';
    const vol = parseFloat(volume);
    if (!volume || isNaN(vol)) e.volume = 'Champ requis';
    else if (vol <= 0) e.volume = 'Valeur doit être supérieure à 0';
    else if (vol > 10000) e.volume = 'Volume max 10 000 m³';
    const prix = parseFloat(effectivePrice);
    if (!effectivePrice || isNaN(prix) || prix <= 0) e.prix = 'Prix unitaire requis';
    if (!dateLivraison) e.dateLivraison = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return; // double-submit guard
    if (!validate()) return;
    setLoading(true);
    try {
      const devisId = `DEV-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const clientLabel = CLIENTS.find(c => c.value === client)?.label || client;
      const vol = parseFloat(volume);
      const prix = parseFloat(effectivePrice);

      const { error } = await supabase.from('devis').insert({
        devis_id: devisId,
        client_id: client,
        formule_id: formule,
        volume_m3: vol,
        prix_vente_m3: prix,
        cut_per_m3: prix * 0.5, // estimated material cost
        total_ht: vol * prix,
        distance_km: 15, // default
        statut: 'brouillon',
        notes: sanitize(notes) || null,
        date_livraison_souhaitee: dateLivraison || null,
      });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Devis ${devisId} créé — ${clientLabel} · ${formule} · ${formatNumber(vol, { decimals: 1 })} m³ · ${formatNumber(vol * prix)} DH`,
        source_page: 'ventes',
        severite: 'info',
      }).then(() => {});

      const devis = {
        id: devisId, client: clientLabel, chantier: sanitize(chantier), formule, volume: vol,
        prix_unitaire: prix, total: vol * prix, date_livraison: dateLivraison, notes: sanitize(notes), statut: 'Brouillon',
        created_at: new Date().toISOString(),
      };
      onCreated?.(devis);
      showFormSuccess(`✓ Devis ${devisId} créé avec succès`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error creating devis:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible de créer le devis'}`);
      setLoading(false);
    }
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
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading || !client || !chantier || !formule || !volume || !dateLivraison}>
          Créer Devis
        </TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        {/* Sigma warning */}
        {isSigmaSelected && (
          <div style={{
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
            fontSize: 11, padding: '10px 14px', borderRadius: 6,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444',
          }}>
            ⚠ ATTENTION — Sigma Bâtiment : 189K DH impayés · Score 23/100 · Livraisons suspendues
          </div>
        )}

        <TBOSFormRow>
          <TBOSField label="Client" required error={errors.client}>
            <TBOSSelect data-field="client" value={client} onChange={e => setClient(e.target.value)}
              hasError={!!errors.client} options={CLIENTS} placeholder="Sélectionner un client" />
          </TBOSField>
          <TBOSField label="Chantier" required error={errors.chantier}>
            <TBOSInput data-field="chantier" value={chantier} onChange={e => setChantier(e.target.value)}
              hasError={!!errors.chantier} placeholder="Nom du chantier ou adresse" maxLength={200} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Formule" required error={errors.formule}>
            <TBOSSelect data-field="formule" value={formule} onChange={e => handleFormuleChange(e.target.value)}
              hasError={!!errors.formule} options={FORMULES.map(f => ({ value: f.value, label: f.label }))} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Volume (m³)" required error={errors.volume}>
            <TBOSInput data-field="volume" type="number" step="0.5" min="0.1" max="10000" value={volume}
              onChange={e => setVolume(e.target.value)} hasError={!!errors.volume} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Prix unitaire (DH/m³)" error={errors.prix}>
            <TBOSInput type="number" min="1" value={effectivePrice} onChange={e => setPrixUnit(e.target.value)}
              hasError={!!errors.prix} style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSDisplayField label="Total HT" value={total > 0 ? `${total.toLocaleString('fr-FR')} DH` : '—'} />
          <TBOSField label="Date livraison souhaitée" required error={errors.dateLivraison}>
            <TBOSInput data-field="dateLivraison" type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
              hasError={!!errors.dateLivraison} min={new Date().toISOString().split('T')[0]} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes internes..." maxLength={1000} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
