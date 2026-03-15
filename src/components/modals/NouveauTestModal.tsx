import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const BATCHES = [
  { value: 'BN-0142', label: 'BN-0142 — F-B25 · 8m³' },
  { value: 'BN-0141', label: 'BN-0141 — F-B30 · 6m³' },
  { value: 'BN-0140', label: 'BN-0140 — F-B25 · 10m³' },
  { value: 'BN-0139', label: 'BN-0139 — F-B35 · 8m³' },
];

const TEST_TYPES = [
  { value: 'slump', label: 'Slump (Affaissement)', unit: 'cm', norme: '15-20 cm', min: 15, max: 20 },
  { value: 'resistance_7j', label: 'Résistance 7j', unit: 'MPa', norme: '>25 MPa', min: 25, max: 999 },
  { value: 'resistance_28j', label: 'Résistance 28j', unit: 'MPa', norme: '>30 MPa', min: 30, max: 999 },
  { value: 'temperature', label: 'Température', unit: '°C', norme: '15-32 °C', min: 15, max: 32 },
  { value: 'air_occlus', label: 'Air occlus', unit: '%', norme: '3-6%', min: 3, max: 6 },
  { value: 'ratio_ec', label: 'Ratio E/C', unit: '', norme: '<0.55', min: 0, max: 0.55 },
];

const OPERATORS = [
  { value: 'youssef', label: 'Youssef M.' },
  { value: 'sarah', label: 'Sarah L.' },
  { value: 'karim', label: 'Karim B.' },
  { value: 'ahmed', label: 'Ahmed R.' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (test: any) => void; }

export function NouveauTestModal({ open, onClose, onCreated }: Props) {
  const [batch, setBatch] = useState('');
  const [testType, setTestType] = useState('');
  const [resultat, setResultat] = useState('');
  const [operateur, setOperateur] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedTest = TEST_TYPES.find(t => t.value === testType);

  const ecart = useMemo(() => {
    if (!selectedTest || !resultat) return null;
    const val = parseFloat(resultat);
    if (isNaN(val)) return null;
    if (val >= selectedTest.min && val <= selectedTest.max) return { ok: true, text: '✓ Conforme' };
    const deviation = val < selectedTest.min
      ? (((selectedTest.min - val) / selectedTest.min) * 100).toFixed(1)
      : (((val - selectedTest.max) / selectedTest.max) * 100).toFixed(1);
    return { ok: false, text: `✗ ${val < selectedTest.min ? '-' : '+'}${deviation}% hors norme` };
  }, [selectedTest, resultat]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!batch) e.batch = 'Champ requis';
    if (!testType) e.testType = 'Champ requis';
    if (!resultat || parseFloat(resultat) <= 0) e.resultat = 'Valeur doit être positive';
    if (!operateur) e.operateur = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const test = { batch, testType: selectedTest?.label, resultat: parseFloat(resultat), conforme: ecart?.ok, operateur, notes };
    onCreated?.(test);
    showFormSuccess(`✓ Test ${selectedTest?.label} enregistré — ${batch}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setBatch(''); setTestType(''); setResultat(''); setOperateur(''); setNotes('');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Test Laboratoire" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Enregistrer Test</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Batch" required error={errors.batch}>
            <TBOSSelect value={batch} onChange={e => setBatch(e.target.value)} hasError={!!errors.batch}
              options={BATCHES} placeholder="Sélectionner un batch" />
          </TBOSField>
          <TBOSField label="Type de test" required error={errors.testType}>
            <TBOSSelect value={testType} onChange={e => setTestType(e.target.value)} hasError={!!errors.testType}
              options={TEST_TYPES.map(t => ({ value: t.value, label: t.label }))} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow cols={3}>
          <TBOSField label={`Résultat${selectedTest ? ` (${selectedTest.unit})` : ''}`} required error={errors.resultat}>
            <TBOSInput type="number" step="0.1" value={resultat} onChange={e => setResultat(e.target.value)}
              hasError={!!errors.resultat} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          {selectedTest && <TBOSDisplayField label="Norme" value={selectedTest.norme} />}
          {ecart && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 11, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Écart</label>
              <div style={{
                padding: '10px 14px', borderRadius: 6, fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 13,
                fontWeight: 700, color: ecart.ok ? '#22C55E' : '#EF4444',
                background: ecart.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${ecart.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {ecart.text}
              </div>
            </div>
          )}
        </TBOSFormRow>

        <TBOSField label="Opérateur" required error={errors.operateur}>
          <TBOSSelect value={operateur} onChange={e => setOperateur(e.target.value)} hasError={!!errors.operateur}
            options={OPERATORS} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
