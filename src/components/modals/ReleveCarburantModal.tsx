import { useState } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect,
  TBOSPrimaryButton, TBOSGhostButton, TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const TRUCKS = [
  { value: 'T-04', label: 'T-04' },
  { value: 'T-07', label: 'T-07' },
  { value: 'T-09', label: 'T-09' },
  { value: 'T-12', label: 'T-12' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (r: any) => void; }

export function ReleveCarburantModal({ open, onClose, onCreated }: Props) {
  const [toupie, setToupie] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState('');
  const [litres, setLitres] = useState('');
  const [cout, setCout] = useState('');
  const [station, setStation] = useState('');
  const [plein, setPlein] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!toupie) e.toupie = 'Champ requis';
    if (!km || parseFloat(km) <= 0) e.km = 'Valeur doit être positive';
    if (!litres || parseFloat(litres) <= 0) e.litres = 'Valeur doit être positive';
    if (!cout || parseFloat(cout) <= 0) e.cout = 'Valeur doit être positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onCreated?.({ toupie, date, km: parseFloat(km), litres: parseFloat(litres), cout: parseFloat(cout), station, plein });
    showFormSuccess(`✓ Relevé carburant enregistré — ${toupie}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setToupie(''); setDate(new Date().toISOString().slice(0, 10)); setKm(''); setLitres('');
    setCout(''); setStation(''); setPlein(true); setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Relevé Carburant" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Enregistrer</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Toupie" required error={errors.toupie}>
            <TBOSSelect value={toupie} onChange={e => setToupie(e.target.value)} hasError={!!errors.toupie}
              options={TRUCKS} placeholder="Sélectionner" />
          </TBOSField>
          <TBOSField label="Date" required>
            <TBOSInput type="date" value={date} onChange={e => setDate(e.target.value)} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label="Kilométrage (km)" required error={errors.km}>
            <TBOSInput type="number" value={km} onChange={e => setKm(e.target.value)} hasError={!!errors.km}
              placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Quantité carburant (L)" required error={errors.litres}>
            <TBOSInput type="number" step="0.1" value={litres} onChange={e => setLitres(e.target.value)}
              hasError={!!errors.litres} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          <TBOSField label="Coût (DH)" required error={errors.cout}>
            <TBOSInput type="number" step="0.01" value={cout} onChange={e => setCout(e.target.value)}
              hasError={!!errors.cout} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Station">
            <TBOSInput value={station} onChange={e => setStation(e.target.value)} placeholder="Nom de la station" />
          </TBOSField>
          <TBOSField label="Plein complet">
            <button onClick={() => setPlein(!plein)} style={{
              padding: '10px 14px', borderRadius: 6, cursor: 'pointer', width: '100%', textAlign: 'left',
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 13,
              background: plein ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
              color: plein ? '#22C55E' : '#9CA3AF',
              border: plein ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {plein ? '✓ Plein complet' : '○ Partiel'}
            </button>
          </TBOSField>
        </TBOSFormRow>
      </TBOSFormStack>
    </TBOSModal>
  );
}
