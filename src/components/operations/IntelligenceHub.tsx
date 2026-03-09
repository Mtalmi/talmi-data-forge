import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Sun, Moon, Users, Package, TrendingUp, FileText,
  Clock, AlertTriangle, CheckCircle, Brain, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function parseResume(content: string): string {
  let text = content;
  try {
    const p = JSON.parse(content);
    if (p.resume_journee) text = p.resume_journee;
    else if (p.resume) text = p.resume;
    else if (p.content) text = p.content;
    else if (typeof p === 'string') text = p;
  } catch {
    // Not JSON — use raw content
  }
  text = text.replace(/^#+\s+.*\n?/, '').trim();
  return text.substring(0, 250);
}

function parseJsonField(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [String(p)]; } catch { return val ? [String(val)] : []; }
}

const SCORE_COLORS: Record<string, string> = {
  'Excellent': 'border-yellow-400/30 bg-yellow-400/10',
  'Bon': 'border-green-400/30 bg-green-400/10',
  'À risque': 'border-orange-400/30 bg-orange-400/10',
  'Attention': 'border-orange-400/30 bg-orange-400/10',
  'Critique': 'border-red-400/30 bg-red-400/10',
};

// #5 Score badges — amber gold styling
function ScoreBadge({ score }: { score: string | null }) {
  if (!score) return null;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: 'rgba(212,168,67,0.15)',
        color: '#D4A843',
        border: '1px solid rgba(212,168,67,0.4)',
      }}
    >
      {score}
    </span>
  );
}

// ─── Gold top border ──────────────────────────────────────────────────────────
const goldTopBorder: React.CSSProperties = {
  borderTop: '2px solid transparent',
  borderImage: 'linear-gradient(90deg, #D4A843, transparent) 1',
};

// ─── Gold shimmer keyframes (injected once) ───────────────────────────────────
const shimmerStyleId = 'gold-shimmer-style';
if (typeof document !== 'undefined' && !document.getElementById(shimmerStyleId)) {
  const style = document.createElement('style');
  style.id = shimmerStyleId;
  style.textContent = `
    @keyframes goldShimmer {
      0%, 100% { border-color: rgba(212,168,67,0.3); }
      50% { border-color: rgba(212,168,67,0.7); }
    }
    .gold-shimmer-border {
      animation: goldShimmer 4s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ─── AI Badge ─────────────────────────────────────────────────────────────────
function AiBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ color: '#D4A843', background: 'rgba(15,22,41,0.8)', border: '1px solid #D4A843' }}
    >
      ✨ Généré par IA · Claude Opus
    </span>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconColor, children, delay = 0, isAiCard = false }: {
  title: string; icon: any; iconColor: string; children: React.ReactNode; delay?: number; isAiCard?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("rounded-xl border border-border bg-card p-5", isAiCard && "gold-shimmer-border")}
      style={goldTopBorder}
    >
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <Icon className={cn('w-4 h-4', iconColor)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {isAiCard && <AiBadge />}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface IntelligenceHubProps {
  devisStats?: { count: number; avgScore: number } | null;
}

export function IntelligenceHub({ devisStats }: IntelligenceHubProps) {
  const [loading, setLoading] = useState(true);
  const [morningBriefing, setMorningBriefing] = useState<any>(null);
  const [eveningBriefing, setEveningBriefing] = useState<any>(null);
  const [clientHealth, setClientHealth] = useState<Record<string, number>>({});
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [dealScores, setDealScores] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [
      { data: briefings },
      { data: clients },
      { data: stocks },
      { data: cashFlow },
      { data: deals },
    ] = await Promise.all([
      supabase.from('ai_briefings').select('*').order('generated_at', { ascending: false }).limit(10),
      supabase.from('client_intelligence').select('id, score_sante, nom_client'),
      supabase.from('stock_autonomy_cache').select('*').lte('days_remaining', 5),
      supabase.from('cash_flow_forecasts').select('*').order('generated_at', { ascending: false }).limit(1),
      supabase.from('devis').select('devis_id, score_ia, niveau_score, ai_recommandation, scored_at, client_id').not('score_ia', 'is', null).order('scored_at', { ascending: false }).limit(5),
    ]);

    // Briefings
    if (briefings?.length) {
      const morning = briefings.find((b: any) => b.briefing_type === 'morning' || b.type === 'morning');
      const evening = briefings.find((b: any) => b.briefing_type === 'evening' || b.type === 'evening');
      setMorningBriefing(morning || null);
      setEveningBriefing(evening || null);
    }

    // Client health counts
    if (clients?.length) {
      const counts: Record<string, number> = {};
      clients.forEach((c: any) => {
        const s = c.score_sante || 'Non évalué';
        counts[s] = (counts[s] || 0) + 1;
      });
      setClientHealth(counts);
    }

    // Stock alerts (days_remaining ≤ 5)
    if (stocks?.length) {
      setStockAlerts(stocks);
    }

    // Cash flow forecast
    if (cashFlow?.length) {
      setForecast(cashFlow[0]);
    }

    // Deal scores
    if (deals?.length) {
      setDealScores(deals);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Realtime for briefings + forecasts
    const ch1 = supabase.channel('hub-briefings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_briefings' }, () => fetchAll())
      .subscribe();
    const ch2 = supabase.channel('hub-forecasts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_flow_forecasts' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
        <span className="text-sm text-muted-foreground">Chargement du hub intelligence...</span>
      </div>
    );
  }

  const tauxNum = forecast?.taux_recouvrement ? parseFloat(forecast.taux_recouvrement) : null;

  return (
    <div className="space-y-4">
      {/* #2 Section header with gold left border */}
      <div className="flex items-center gap-2 mb-2" style={{ borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
        <Brain className="w-4 h-4 text-yellow-400" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">🧠 Hub Intelligence IA — Vue Temps Réel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── 1. Morning Briefing — #4 AI card with shimmer + badge ─── */}
        <SectionCard title="Briefing du Matin" icon={Sun} iconColor="text-yellow-400" delay={0.05} isAiCard>
          {morningBriefing ? (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                {parseResume(morningBriefing.content)}
              </p>
              {morningBriefing.score_journee && (
                <div className="mt-3"><ScoreBadge score={morningBriefing.score_journee} /></div>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">{relTime(morningBriefing.generated_at)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">🤖 En attente du briefing matinal...</p>
          )}
        </SectionCard>

        {/* ── 2. Evening Report — #4 AI card with shimmer + badge ──── */}
        <SectionCard title="Rapport du Soir" icon={Moon} iconColor="text-purple-400" delay={0.1} isAiCard>
          {eveningBriefing ? (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                {parseResume(eveningBriefing.content)}
              </p>
              {eveningBriefing.score_journee && (
                <div className="mt-3"><ScoreBadge score={eveningBriefing.score_journee} /></div>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">{relTime(eveningBriefing.generated_at)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">🤖 En attente du rapport de fin de journée...</p>
          )}
        </SectionCard>

        {/* ── 3. Client Health Overview ───────────────────────────────── */}
        <SectionCard title="Santé Clients" icon={Users} iconColor="text-blue-400" delay={0.15}>
          {Object.keys(clientHealth).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {['Excellent', 'Bon', 'À risque', 'Critique', 'Non évalué'].filter(k => clientHealth[k]).map(score => (
                <div key={score} className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold',
                  SCORE_COLORS[score] || 'text-muted-foreground border-border bg-muted/10'
                )} style={{ color: '#D4A843' }}>
                  <span className="text-lg font-mono font-bold">{clientHealth[score]}</span>
                  <span>{score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">🤖 Aucune donnée client disponible...</p>
          )}
        </SectionCard>

        {/* ── 4. Stock Alerts ─────────────────────────────────────────── */}
        <SectionCard title="Alertes Stock" icon={Package} iconColor="text-orange-400" delay={0.2}>
          {stockAlerts.length > 0 ? (
            <div className="space-y-2">
              {stockAlerts.map((s: any) => {
                const days = s.days_remaining;
                const isCritique = days != null && days <= 2;
                return (
                  <div key={s.id} className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg border text-xs',
                    isCritique ? 'border-red-400/30 bg-red-400/5' : 'border-orange-400/30 bg-orange-400/5'
                  )}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn('w-3.5 h-3.5', isCritique ? 'text-red-400' : 'text-orange-400')} />
                      <span className="font-semibold capitalize">{s.materiau}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-mono font-bold', isCritique ? 'text-red-400' : 'text-orange-400')}>
                        {days != null ? `${days}j` : '?'}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full border font-semibold',
                        isCritique ? 'text-red-400 border-red-400/40 bg-red-400/10' : 'text-orange-400 border-orange-400/40 bg-orange-400/10'
                      )}>
                        {isCritique ? 'Critique' : 'Bas'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Tous les stocks au-dessus du seuil d'alerte</span>
            </div>
          )}
        </SectionCard>

        {/* ── 5. Financial Health ─────────────────────────────────────── */}
        <SectionCard title="Santé Financière" icon={TrendingUp} iconColor="text-green-400" delay={0.25}>
          {forecast ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ScoreBadge score={forecast.score_sante} />
                {forecast.resume && (
                  <span className="text-xs text-muted-foreground line-clamp-1 flex-1">{forecast.resume}</span>
                )}
              </div>
              {tauxNum != null && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Taux de recouvrement</span>
                    <span className={cn('text-sm font-mono font-bold',
                      tauxNum >= 80 ? 'text-green-400' : tauxNum >= 60 ? 'text-orange-400' : 'text-red-400'
                    )}>{forecast.taux_recouvrement}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700',
                      tauxNum >= 80 ? 'bg-green-400' : tauxNum >= 60 ? 'bg-orange-400' : 'bg-red-400'
                    )} style={{ width: `${Math.min(tauxNum, 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">{relTime(forecast.generated_at)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">🤖 Première prévision en cours de génération...</p>
          )}
        </SectionCard>

        {/* ── 6. Recent Deal Scores — #9 wired to devis table ─────── */}
        <SectionCard title="Scores Devis IA" icon={FileText} iconColor="text-yellow-400" delay={0.3}>
          {dealScores.length > 0 ? (
            <div className="space-y-2">
              {devisStats && (
                <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#D4A843' }}>{devisStats.count} devis scorés</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#D4A843' }}>Moy: {devisStats.avgScore}/100</span>
                </div>
              )}
              {dealScores.map((d: any) => (
                <div key={d.devis_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-foreground truncate">{d.devis_id}</span>
                    {d.niveau_score && <ScoreBadge score={d.niveau_score} />}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn('font-mono font-bold text-sm',
                      (d.score_ia ?? 0) >= 80 ? 'text-green-400' : (d.score_ia ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {d.score_ia}/100
                    </span>
                    <span className="text-muted-foreground font-mono">{relTime(d.scored_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : devisStats && devisStats.count > 0 ? (
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <span className="text-xs font-semibold" style={{ color: '#D4A843' }}>{devisStats.count} devis scorés · Moy: {devisStats.avgScore}/100</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">🤖 Aucun devis scoré par l'IA...</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
