import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTodayBatches } from '@/hooks/useModalData';

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
  const { batches } = useTodayBatches();
  const [batch, setBatch] = useState('');
  const [testType, setTestType] = useState('');
  const [resultat, setResultat] = useState('');
  const [operateur, setOperateur] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedBatch = batches.find(b => b.value === batch);
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

  const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!batch) e.batch = 'Champ requis';
    if (!testType) e.testType = 'Champ requis';
    const val = parseFloat(resultat);
    if (!resultat || isNaN(val)) e.resultat = 'Champ requis';
    else if (val <= 0 && testType !== 'ratio_ec') e.resultat = 'Valeur doit être positive';
    if (!operateur) e.operateur = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const val = parseFloat(resultat);
      const isConforme = ecart?.ok ?? true;
      const blId = selectedBatch?.blId || 'BL-2603-009';
      const formuleId = selectedBatch?.formule || 'F-B25';

      const insertData: Record<string, any> = {
        bl_id: blId,
        formule_id: formuleId,
        date_prelevement: new Date().toISOString().split('T')[0],
        technicien_prelevement: OPERATORS.find(o => o.value === operateur)?.label || operateur,
        technicien_test: OPERATORS.find(o => o.value === operateur)?.label || operateur,
        notes: sanitize(notes) || null,
        alerte_qualite: !isConforme,
      };

      if (testType === 'slump') {
        insertData.affaissement_mm = val * 10;
        insertData.affaissement_conforme = isConforme;
      } else if (testType === 'resistance_7j') {
        insertData.resistance_7j_mpa = val;
        insertData.date_test_7j = new Date().toISOString().split('T')[0];
        insertData.resistance_conforme = isConforme;
      } else if (testType === 'resistance_28j') {
        insertData.resistance_28j_mpa = val;
        insertData.date_test_28j = new Date().toISOString().split('T')[0];
        insertData.resistance_conforme = isConforme;
      }

      const { error } = await supabase.from('tests_laboratoire').insert(insertData as any);
      if (error) throw error;

      await supabase.from('activity_log').insert({
        type: 'action',
        message: `Test ${selectedTest?.label} enregistré — ${batch} · ${val} ${selectedTest?.unit} · ${isConforme ? 'Conforme' : 'Non-conforme'}`,
        source_page: 'laboratoire',
        severite: isConforme ? 'info' : 'warning',
      }).then(() => {});

      if (!isConforme) {
        await supabase.from('alertes').insert({
          type: 'qualite',
          severite: 'warning',
          titre: `Non-conformité ${batch}`,
          message: `${selectedTest?.label}: ${val} ${selectedTest?.unit} (${ecart?.text}). Formule ${formuleId}.`,
          entity_type: 'test',
          entity_id: batch,
          page_source: 'laboratoire',
        }).then(() => {});
      }

      const test = { batch, testType: selectedTest?.label, resultat: val, conforme: isConforme, operateur, notes: sanitize(notes) };
      onCreated?.(test);
      showFormSuccess(`✓ Test ${selectedTest?.label} enregistré — ${batch}`);
      resetAndClose();
    } catch (error: any) {
      console.error('Error saving test:', error);
      toast.error(`Erreur: ${error?.message || 'Impossible d\'enregistrer le test'}`);
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setBatch(''); setTestType(''); setResultat(''); setOperateur(''); setNotes('');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouveau Test Laboratoire" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} disabled={loading}>Enregistrer Test</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSFormRow>
          <TBOSField label="Batch" required error={errors.batch}>
            <TBOSSelect value={batch} onChange={e => setBatch(e.target.value)} hasError={!!errors.batch}
              options={batches} placeholder="Sélectionner un batch" />
          </TBOSField>
          <TBOSField label="Type de test" required error={errors.testType}>
            <TBOSSelect value={testType} onChange={e => setTestType(e.target.value)} hasError={!!errors.testType}
              options={TEST_TYPES.map(t => ({ value: t.value, label: t.label }))} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        {selectedBatch && <TBOSDisplayField label="Formule" value={selectedBatch.formule} />}

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
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..." maxLength={500} />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}
