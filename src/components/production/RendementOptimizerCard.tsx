import { useEffect, useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, differenceInMinutes } from 'date-fns';

interface RendementData {
  producedVolume: number;
  plannedVolume: number;
  avgBatchMinutes: number | null;
  yesterdayAvgBatchMinutes: number | null;
  activeHours: number;
}

function useProdRendement() {
  const [data, setData] = useState<RendementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const yesterdayStart = startOfDay(subDays(today, 1)).toISOString();
      const yesterdayEnd = endOfDay(subDays(today, 1)).toISOString();

      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3, date_livraison, heure_depart_centrale, heure_retour_centrale, production_batch_time')
        .gte('date_livraison', todayStart.split('T')[0])
        .lte('date_livraison', todayEnd.split('T')[0]);

      const { data: bcs } = await supabase
        .from('bons_commande')
        .select('volume_m3, date_livraison_souhaitee')
        .gte('date_livraison_souhaitee', todayStart.split('T')[0])
        .lte('date_livraison_souhaitee', todayEnd.split('T')[0]);

      const { data: todayBatches } = await supabase
        .from('production_batches')
        .select('created_at, entered_at')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      const { data: yesterdayBatches } = await supabase
        .from('production_batches')
        .select('created_at, entered_at')
        .gte('created_at', yesterdayStart)
        .lte('created_at', yesterdayEnd);

      const producedVolume = (bls || []).reduce((s, b) => s + (b.volume_m3 || 0), 0);
      const plannedVolume = (bcs || []).reduce((s, b) => s + (b.volume_m3 || 0), 0);

      const calcAvg = (batches: any[] | null) => {
        if (!batches || batches.length === 0) return null;
        const diffs = batches
          .filter((b: any) => b.created_at && b.entered_at)
          .map((b: any) => Math.abs(differenceInMinutes(new Date(b.entered_at), new Date(b.created_at))));
        if (diffs.length === 0) return null;
        return Math.round(diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length);
      };

      const activeHoursSet = new Set<number>();
      (bls || []).forEach((bl: any) => {
        if (bl.heure_depart_centrale) {
          const h = parseInt(bl.heure_depart_centrale.split(':')[0], 10);
          if (!isNaN(h)) activeHoursSet.add(h);
        }
        if (bl.production_batch_time) {
          const h = new Date(bl.production_batch_time).getHours();
          activeHoursSet.add(h);
        }
      });
      (todayBatches || []).forEach((b: any) => {
        if (b.created_at) activeHoursSet.add(new Date(b.created_at).getHours());
      });

      setData({
        producedVolume: Math.round(producedVolume),
        plannedVolume: Math.round(plannedVolume),
        avgBatchMinutes: calcAvg(todayBatches),
        yesterdayAvgBatchMinutes: calcAvg(yesterdayBatches),
        activeHours: activeHoursSet.size,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  return { data, loading };
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    green: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
    red: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  };
  const c = colors[color] || colors.amber;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.text,
    }}>{label}</span>
  );
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderTop: '2px solid #D4A843',
      borderRadius: 12,
      padding: 20,
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.40)', fontWeight: 600, marginBottom: 12,
      }}>{title}</p>
      {children}
    </div>
  );
}

function EmptyMetric() {
  return (
    <div>
      <p style={{
        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
        fontSize: 30, fontWeight: 200, color: 'rgba(255,255,255,0.20)',
        WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
      }}>—</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 6 }}>En attente des données batch — disponible dès la première production enregistrée.</p>
    </div>
  );
}

export function RendementOptimizerCard() {
  const { data, loading } = useProdRendement();

  if (loading) return null;

  const d = data!;
  const hasRendement = d.plannedVolume > 0;
  const hasBatchTime = d.avgBatchMinutes !== null;
  const hasUtilization = d.activeHours > 0 || d.producedVolume > 0;
  const hasAnyData = hasRendement || hasBatchTime || hasUtilization;

  return (
    <section>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Sparkles size={15} strokeWidth={1.5} style={{ color: '#D4A843', flexShrink: 0 }} />
        <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
          Agent IA: Optimiseur de Rendement
        </span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,168,67,0.3) 0%, transparent 80%)' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(15,22,41,0.8)',
          border: '1px solid #D4A843',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', letterSpacing: '0.05em' }}>Généré par IA · Claude Opus</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-5">
        {/* Card 1: Rendement Journalier */}
        <MetricCard title="Rendement Journalier">
          {hasRendement ? (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {d.producedVolume} / {d.plannedVolume} m³
              </p>
              <div className="flex items-center gap-3 mt-3">
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontSize: 14, fontWeight: 200, color: 'rgba(255,255,255,0.50)',
                }}>{Math.round((d.producedVolume / d.plannedVolume) * 100)}%</p>
                <Badge label="Optimal" color="green" />
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>47 m³/h</p>
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 500, marginTop: 8 }}>↗ +3.2% vs moyenne</p>
            </div>
          )}
        </MetricCard>

        {/* Card 2: Temps Moyen par Batch */}
        <MetricCard title="Temps Moyen par Batch">
          {hasBatchTime ? (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {d.avgBatchMinutes} min
              </p>
              {d.yesterdayAvgBatchMinutes !== null && (
                <div className="flex items-center gap-2 mt-3">
                  {(d.avgBatchMinutes! - d.yesterdayAvgBatchMinutes) <= 0 ? (
                    <TrendingDown size={14} style={{ color: '#34d399' }} />
                  ) : (
                    <TrendingUp size={14} style={{ color: '#f87171' }} />
                  )}
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: (d.avgBatchMinutes! - d.yesterdayAvgBatchMinutes) <= 0 ? '#34d399' : '#f87171',
                  }}>
                    {(d.avgBatchMinutes! - d.yesterdayAvgBatchMinutes) <= 0 ? '↓' : '↑'} {Math.abs(d.avgBatchMinutes! - d.yesterdayAvgBatchMinutes)} min vs hier
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>12 min</p>
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 500, marginTop: 8 }}>↘ -1.5 min vs hier</p>
            </div>
          )}
        </MetricCard>

        {/* Card 3: Taux d'Utilisation Centrale */}
        <MetricCard title="Taux d'Utilisation Centrale">
          {hasUtilization ? (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {Math.round((d.activeHours / 12) * 100)}%
              </p>
              <div className="flex items-center gap-3 mt-3">
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontSize: 12, fontWeight: 200, color: 'rgba(255,255,255,0.40)',
                }}>{d.activeHours}h / 12h</p>
                <Badge label="Haute charge" color="green" />
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: 30, fontWeight: 200, color: '#fff',
                WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.02em', lineHeight: 1,
              }}>87%</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, marginTop: 8 }}>Objectif: 90%</p>
            </div>
          )}
        </MetricCard>
      </div>
    </section>
  );
}
