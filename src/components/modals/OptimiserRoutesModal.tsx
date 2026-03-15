import { useState } from 'react';
import { TBOSModal, TBOSPrimaryButton, TBOSGhostButton, showFormSuccess } from '@/components/ui/TBOSModal';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const DELIVERIES = [
  { id: 'BL-2603-005', client: 'TGCC', volume: '8m³', destination: 'Hay Riad, Rabat', creneau: '08h-10h' },
  { id: 'BL-2603-006', client: 'Constructions Modernes', volume: '10m³', destination: 'Temara Centre', creneau: '10h-12h' },
  { id: 'BL-2603-007', client: 'BTP Maroc', volume: '6m³', destination: 'Skhirat', creneau: '14h-16h' },
];

interface Props { open: boolean; onClose: () => void; onApply?: () => void; }

export function OptimiserRoutesModal({ open, onClose, onApply }: Props) {
  const [selected, setSelected] = useState<string[]>(DELIVERIES.map(d => d.id));
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleApply = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onApply?.();
    showFormSuccess('✓ Routes optimisées — économie estimée 1 800 DH');
    onClose();
    setLoading(false);
  };

  return (
    <TBOSModal open={open} onClose={onClose} title="Optimisation de Routes — Aujourd'hui" width={800} footer={
      <>
        <TBOSGhostButton onClick={onClose}>Garder Plan Actuel</TBOSGhostButton>
        <TBOSPrimaryButton onClick={handleApply} loading={loading}>Appliquer Optimisation</TBOSPrimaryButton>
      </>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: deliveries */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
            Livraisons du jour
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DELIVERIES.map(d => (
              <button key={d.id} onClick={() => toggle(d.id)} style={{
                padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                background: selected.includes(d.id) ? 'rgba(212,168,67,0.06)' : 'rgba(255,255,255,0.02)',
                border: selected.includes(d.id) ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 150ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selected.includes(d.id) ? '#D4A843' : 'transparent',
                    border: selected.includes(d.id) ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    color: '#0F1629', fontSize: 12, fontWeight: 700,
                  }}>
                    {selected.includes(d.id) ? '✓' : ''}
                  </span>
                  <div>
                    <p style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843', fontWeight: 600, margin: 0 }}>{d.id}</p>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                      {d.client} · {d.volume} · {d.destination} · {d.creneau}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: comparison */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
            Comparaison
          </p>

          {/* Current */}
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', letterSpacing: '1px', marginBottom: 8, textTransform: 'uppercase' }}>Plan actuel</p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#F1F5F9', margin: 0 }}>
              3 livraisons · 210 km · 87L carburant · 5h20
            </p>
          </div>

          {/* Optimized */}
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.15)', marginBottom: 12 }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', letterSpacing: '1px', marginBottom: 8, textTransform: 'uppercase' }}>
              ✨ Optimisé IA
            </p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#F1F5F9', margin: 0 }}>
              3 livraisons · 163 km · 68L carburant · 4h05
            </p>
          </div>

          {/* Savings */}
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: '#22C55E', letterSpacing: '1px', marginBottom: 8, textTransform: 'uppercase' }}>
              Économies
            </p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#22C55E', fontWeight: 600, margin: 0 }}>
              −47 km · −19L · −1h15 · 1 800 DH
            </p>
          </div>
        </div>
      </div>
    </TBOSModal>
  );
}
