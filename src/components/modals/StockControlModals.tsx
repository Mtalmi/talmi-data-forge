import { useState, useMemo } from 'react';
import {
  TBOSModal, TBOSField, TBOSInput, TBOSSelect, TBOSTextarea,
  TBOSDisplayField, TBOSPrimaryButton, TBOSGhostButton,
  TBOSFormRow, TBOSFormStack, showFormSuccess,
} from '@/components/ui/TBOSModal';

const MATERIAUX = [
  { value: 'ciment', label: 'Ciment', stock: 127, unit: 'T' },
  { value: 'sable', label: 'Sable', stock: 340, unit: 'T' },
  { value: 'gravette', label: 'Gravette', stock: 280, unit: 'T' },
  { value: 'adjuvant', label: 'Adjuvant', stock: 1.2, unit: 'T' },
  { value: 'eau', label: 'Eau', stock: 45, unit: 'm³' },
];

const OPERATORS = [
  { value: 'youssef', label: 'Youssef M.' },
  { value: 'karim', label: 'Karim B.' },
  { value: 'ahmed', label: 'Ahmed R.' },
];

/* ── CONTRÔLE QUALITÉ ── */
interface ControlProps { open: boolean; onClose: () => void; onCreated?: (c: any) => void; }

export function ControleQualiteModal({ open, onClose, onCreated }: ControlProps) {
  const [materiau, setMateriau] = useState('');
  const [stockPhysique, setStockPhysique] = useState('');
  const [controleur, setControleur] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedMat = MATERIAUX.find(m => m.value === materiau);

  const ecart = useMemo(() => {
    if (!selectedMat || !stockPhysique) return null;
    const phys = parseFloat(stockPhysique);
    const sys = selectedMat.stock;
    const diff = phys - sys;
    const pct = ((diff / sys) * 100).toFixed(1);
    return { diff, pct: parseFloat(pct), critical: Math.abs(parseFloat(pct)) > 2 };
  }, [selectedMat, stockPhysique]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!materiau) e.materiau = 'Champ requis';
    if (!stockPhysique || parseFloat(stockPhysique) <= 0) e.stockPhysique = 'Valeur doit être positive';
    if (!controleur) e.controleur = 'Champ requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onCreated?.({ materiau: selectedMat?.label, stockPhysique: parseFloat(stockPhysique), ecart });
    showFormSuccess(`✓ Contrôle qualité enregistré — ${selectedMat?.label}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setMateriau(''); setStockPhysique(''); setControleur(''); setNotes('');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Contrôle Qualité Stock" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading}>Enregistrer Contrôle</TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSField label="Matériau" required error={errors.materiau}>
          <TBOSSelect value={materiau} onChange={e => setMateriau(e.target.value)} hasError={!!errors.materiau}
            options={MATERIAUX.map(m => ({ value: m.value, label: m.label }))} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSFormRow cols={3}>
          {selectedMat && <TBOSDisplayField label="Stock système" value={`${selectedMat.stock} ${selectedMat.unit}`} />}
          <TBOSField label="Stock physique mesuré" required error={errors.stockPhysique}>
            <TBOSInput type="number" step="0.1" value={stockPhysique} onChange={e => setStockPhysique(e.target.value)}
              hasError={!!errors.stockPhysique} placeholder="0" style={{ textAlign: 'right' }} />
          </TBOSField>
          {ecart && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 11, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Écart</label>
              <div style={{
                padding: '10px 14px', borderRadius: 6, fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 13, fontWeight: 700,
                color: ecart.critical ? '#EF4444' : '#22C55E',
                background: ecart.critical ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${ecart.critical ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              }}>
                {ecart.pct > 0 ? '+' : ''}{ecart.pct}%
              </div>
            </div>
          )}
        </TBOSFormRow>

        <TBOSField label="Contrôleur" required error={errors.controleur}>
          <TBOSSelect value={controleur} onChange={e => setControleur(e.target.value)} hasError={!!errors.controleur}
            options={OPERATORS} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSField label="Notes">
          <TBOSTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..." />
        </TBOSField>
      </TBOSFormStack>
    </TBOSModal>
  );
}

/* ── AJUSTEMENT MANUEL ── */

const MOTIFS = [
  { value: 'correction', label: 'Correction inventaire' },
  { value: 'perte', label: 'Perte' },
  { value: 'don', label: 'Don' },
  { value: 'test', label: 'Test qualité' },
  { value: 'autre', label: 'Autre' },
];

interface AjustementProps { open: boolean; onClose: () => void; onCreated?: (a: any) => void; }

export function AjustementManuelModal({ open, onClose, onCreated }: AjustementProps) {
  const [materiau, setMateriau] = useState('');
  const [ajustement, setAjustement] = useState('');
  const [motif, setMotif] = useState('');
  const [justification, setJustification] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedMat = MATERIAUX.find(m => m.value === materiau);
  const adj = parseFloat(ajustement) || 0;
  const newStock = selectedMat ? selectedMat.stock + adj : 0;
  const isNegative = adj < 0;
  const needsJustification = (motif === 'autre' || isNegative) && !justification.trim();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!materiau) e.materiau = 'Champ requis';
    if (!ajustement || adj === 0) e.ajustement = 'Valeur requise (positive ou négative)';
    if (!motif) e.motif = 'Champ requis';
    if (needsJustification) e.justification = 'Justification requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onCreated?.({ materiau: selectedMat?.label, ajustement: adj, motif, newStock });
    showFormSuccess(`✓ Ajustement enregistré — ${selectedMat?.label} ${adj > 0 ? '+' : ''}${adj} ${selectedMat?.unit}`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setMateriau(''); setAjustement(''); setMotif(''); setJustification('');
    setErrors({}); setLoading(false); onClose();
  };

  return (
    <TBOSModal open={open} onClose={resetAndClose} title="Ajustement Manuel de Stock" footer={
      <>
        <TBOSGhostButton onClick={resetAndClose}>Annuler</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleSubmit} loading={loading} danger={isNegative}>
          Appliquer Ajustement
        </TBOSPrimaryButton>
      </>
    }>
      <TBOSFormStack>
        <TBOSField label="Matériau" required error={errors.materiau}>
          <TBOSSelect value={materiau} onChange={e => setMateriau(e.target.value)} hasError={!!errors.materiau}
            options={MATERIAUX.map(m => ({ value: m.value, label: m.label }))} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSFormRow cols={3}>
          {selectedMat && <TBOSDisplayField label="Stock actuel" value={`${selectedMat.stock} ${selectedMat.unit}`} />}
          <TBOSField label="Ajustement" required error={errors.ajustement}>
            <TBOSInput type="number" step="0.1" value={ajustement} onChange={e => setAjustement(e.target.value)}
              hasError={!!errors.ajustement} placeholder="± 0" style={{ textAlign: 'right' }} />
          </TBOSField>
          {selectedMat && ajustement && (
            <TBOSDisplayField label="Nouveau stock" value={`${newStock.toFixed(1)} ${selectedMat.unit}`} />
          )}
        </TBOSFormRow>

        <TBOSField label="Motif" required error={errors.motif}>
          <TBOSSelect value={motif} onChange={e => setMotif(e.target.value)} hasError={!!errors.motif}
            options={MOTIFS} placeholder="Sélectionner" />
        </TBOSField>

        <TBOSField label="Justification" required={motif === 'autre' || isNegative} error={errors.justification}>
          <TBOSTextarea value={justification} onChange={e => setJustification(e.target.value)}
            placeholder={motif === 'autre' || isNegative ? 'Justification requise...' : 'Optionnel'} />
        </TBOSField>

        <TBOSDisplayField label="Responsable" value="Max Talmi" />
      </TBOSFormStack>
    </TBOSModal>
  );
}
