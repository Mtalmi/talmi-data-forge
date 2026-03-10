// ═══════════════════════════════════════════════════════
// LIVE BATCH PROGRESS — Current production tracking (live data)
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const T = {
  gold: '#D4AF37',
  dotOk: '#34D399',
  dotWarn: '#FBBF24',
};

interface BatchData {
  bl_id: string;
  volume_m3: number;
  workflow_status: string | null;
  client_name: string;
  formule_name: string;
}

function derivePhases(status: string | null) {
  const s = status || 'planification';
  const order = ['planification', 'production', 'en_chargement', 'en_livraison', 'livre'];
  const idx = order.indexOf(s);
  const labels = ['Planification', 'Production', 'Chargement', 'Livraison'];
  return labels.map((label, i) => ({
    label,
    done: i < idx,
    active: i === idx,
  }));
}

function deriveProgress(status: string | null) {
  const map: Record<string, number> = {
    planification: 10, production: 35, en_chargement: 55, en_livraison: 80, livre: 100,
  };
  return map[status || 'planification'] ?? 10;
}

export default function LiveBatchProgress() {
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, volume_m3, workflow_status, client_id, formule_id')
        .order('date_livraison', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) { setLoading(false); return; }

      // Fetch client name & formule name in parallel
      const [clientRes, formuleRes] = await Promise.all([
        supabase.from('clients').select('nom_client').eq('client_id', data.client_id).maybeSingle(),
        supabase.from('formules_theoriques').select('designation').eq('formule_id', data.formule_id).maybeSingle(),
      ]);

      setBatch({
        bl_id: data.bl_id,
        volume_m3: data.volume_m3,
        workflow_status: data.workflow_status,
        client_name: clientRes.data?.nom_client || data.client_id,
        formule_name: formuleRes.data?.designation || data.formule_id,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div
        className="relative overflow-hidden p-5"
        style={{ borderRadius: 8, background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.dotWarn }} />
          <span className="text-[11px] text-white/60">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div
        className="relative overflow-hidden p-5"
        style={{ borderRadius: 8, background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(148,163,184,0.3)' }} />
          <span className="text-[11px] font-medium text-white/60 uppercase tracking-[0.1em]">Batch en Cours</span>
        </div>
        <p className="text-[12px] text-white/40 italic">Aucun batch actif</p>
      </div>
    );
  }

  const phases = derivePhases(batch.workflow_status);
  const progress = deriveProgress(batch.workflow_status);

  return (
    <div
      className="relative overflow-hidden p-5 transition-all duration-500"
      style={{
        borderRadius: 8,
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.dotOk }} />
          <span className="text-[11px] font-medium text-white/90 uppercase tracking-[0.1em]">Batch en Cours</span>
        </div>
        <span className="text-[11px] font-mono tabular-nums" style={{ color: 'rgba(148,163,184,0.5)' }}>{batch.bl_id}</span>
      </div>

      {/* Details */}
      <div className="text-[11px] mb-3" style={{ color: 'rgba(148,163,184,0.6)' }}>
        <span className="text-white/80 font-medium">{batch.formule_name}</span>
        {' · '}{batch.volume_m3} m³{' · '}
        <span className="text-white/70">{batch.client_name}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Progression</span>
          <span className="text-[10px] text-white/80 font-mono font-medium tabular-nums">{progress}%</span>
        </div>
        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${T.dotWarn}, ${T.dotOk})`,
              boxShadow: `0 0 8px rgba(52,211,153,0.2)`,
            }}
          />
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center justify-between mb-3">
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {i > 0 && (
              <div
                className="absolute h-px"
                style={{
                  background: p.done ? T.dotOk : 'rgba(255,255,255,0.06)',
                  opacity: p.done ? 0.4 : 1,
                }}
              />
            )}
            <span className="text-[11px]" style={{ opacity: p.active ? 1 : p.done ? 0.8 : 0.3 }}>
              {p.done ? '✅' : p.active ? '⏳' : '○'}
            </span>
            <span
              className="text-[8px]"
              style={{
                color: p.active ? T.dotWarn : p.done ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.25)',
                fontWeight: p.active ? 500 : 400,
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Connecting line between phases */}
      <div className="flex items-center gap-0 mx-4 -mt-6 mb-3">
        {phases.slice(1).map((p, i) => (
          <div key={i} className="flex-1 h-px" style={{
            background: p.done ? T.dotOk : p.active ? `linear-gradient(90deg, ${T.dotWarn}60, rgba(255,255,255,0.06))` : 'rgba(255,255,255,0.06)',
            opacity: p.done ? 0.3 : 1,
          }} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
          Statut: <span className="text-white/80 font-mono font-medium">{batch.workflow_status || 'planification'}</span>
        </div>
      </div>
    </div>
  );
}
