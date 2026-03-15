import { useState } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const BCS = [
  { value: 'BL-2602-003', label: 'BL-2602-003 — TGCC · 30m³', formule: 'F-B25', volume: '30' },
  { value: 'BL-2603-005', label: 'BL-2603-005 — Constructions Modernes · 24m³', formule: 'F-B30', volume: '24' },
  { value: 'BL-2603-006', label: 'BL-2603-006 — BTP Maroc · 16m³', formule: 'F-B25', volume: '16' },
  { value: 'BL-2603-008', label: 'BL-2603-008 — Saudi Readymix · 40m³', formule: 'F-B35', volume: '40' },
];

const CRENEAUX = [
  { value: '06-10', label: '06h-10h' },
  { value: '10-14', label: '10h-14h' },
  { value: '14-18', label: '14h-18h' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (p: any) => void; }

export function NouvellePlanificationModal({ open, onClose, onCreated }: Props) {
  const [bc, setBc] = useState('');
  const [volume, setVolume] = useState('');
  const [dateProd, setDateProd] = useState('');
  const [creneau, setCreneau] = useState('');
  const [priorite, setPriorite] = useState('normale');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedBC = BCS.find(b => b.value === bc);

  const handleBCChange = (val: string) => {
    setBc(val);
    const found = BCS.find(b => b.value === val);
    if (found) setVolume(found.volume);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bc) e.bc = 'Champ requis';
    if (!dateProd) e.dateProd = 'Champ requis';
    if (!creneau) e.creneau = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onCreated?.({ bc, formule: selectedBC?.formule, volume, dateProd, creneau, priorite });
    showFormSuccess(`✓ Planification créée — ${bc}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setBc(''); setVolume(''); setDateProd(''); setCreneau(''); setPriorite('normale');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Nouvelle Planification" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Planifier</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSField label="Bon de commande" required error={errors.bc}>
          <TBOSSelect value={bc} onChange={e => handleBCChange(e.target.value)} hasError={!!errors.bc}
            options={BCS.map(b => ({ value: b.value, label: b.label }))} placeholder="Sélectionner un BC" />
        </TBOSField>

        <TBOSFormRow>
          {selectedBC && <TBOSDisplayField label="Formule" value={selectedBC.formule} />}
          <TBOSField label="Volume (m³)">
            <TBOSInput type="number" value={volume} onChange={e => setVolume(e.target.value)} style={{ textAlign: 'right' }} />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSField label="Date production" required error={errors.dateProd}>
            <TBOSInput type="date" value={dateProd} onChange={e => setDateProd(e.target.value)} hasError={!!errors.dateProd} />
          </TBOSField>
          <TBOSField label="Créneau" required error={errors.creneau}>
            <TBOSSelect value={creneau} onChange={e => setCreneau(e.target.value)} hasError={!!errors.creneau}
              options={CRENEAUX} placeholder="Sélectionner" />
          </TBOSField>
        </TBOSFormRow>

        <TBOSFormRow>
          <TBOSDisplayField label="Malaxeur" value="Malaxeur Principal" />
          <TBOSField label="Priorité">
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'normale', l: 'Normale', c: '#9CA3AF' }, { v: 'haute', l: 'Haute', c: '#F59E0B' }, { v: 'urgente', l: 'Urgente', c: '#EF4444' }].map(o => (
                <button key={o.v} onClick={() => setPriorite(o.v)} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 11, fontWeight: 600,
                  background: priorite === o.v ? `${o.c}20` : 'rgba(255,255,255,0.03)',
                  color: priorite === o.v ? o.c : '#9CA3AF',
                  border: priorite === o.v ? `1px solid ${o.c}40` : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 150ms',
                }}>
                  {o.l}
                </button>
              ))}
            </div>
          </TBOSField>
        </TBOSFormRow>
      </TBOSFormStack>
    </TBOSModal>
  );
}
