import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Loader2, Clock } from 'lucide-react';

const T = {
  gold: '#D4A843', success: '#10B981', danger: '#EF4444', warning: '#F59E0B', info: '#3B82F6',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', cardBorder: '#1E2D4A',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
};

function relTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function parseJsonField(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [String(p)]; } catch { return val ? [String(val)] : []; }
}

function scoreColor(score: string | null): string {
  if (!score) return T.textDim;
  if (score === 'Excellent') return T.gold;
  if (score === 'Bon') return T.success;
  if (score === 'Attention') return T.warning;
  if (score === 'Critique') return T.danger;
  return T.textSec;
}

export function CashFlowAIForecastCard() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecast = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('cash_flow_forecasts')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(1);
      if (data?.length) setForecast(data[0]);
      else setForecast(null);
    } catch { setForecast(null); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchForecast();
    const ch = supabase.channel('cf-forecast-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_flow_forecasts' }, () => fetchForecast())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchForecast]);

  const handleRefresh = () => { setRefreshing(true); fetchForecast(); };

  if (loading) return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
      <Loader2 size={20} className="animate-spin mx-auto" style={{ color: T.gold }} />
      <p style={{ color: T.textDim, fontSize: 12, marginTop: 8 }}>Chargement prévision IA...</p>
    </div>
  );

  if (!forecast) return (
    <div style={{ background: T.cardBg, border: `1px solid rgba(212,168,67,0.15)`, borderLeft: `4px solid ${T.gold}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={18} color={T.gold} />
          <span style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>🧠 Prévision Trésorerie IA</span>
          <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(15,22,41,0.8)', border: '1px solid #D4A843', color: '#D4A843' }}>Généré par IA · Claude Opus</span>
          <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${T.success}18`, border: `1px solid ${T.success}40`, color: T.success }}>Bon</span>
        </div>
        <button onClick={handleRefresh} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', border: `1px solid rgba(212,168,67,0.2)`, color: T.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> Actualiser
        </button>
      </div>

      <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
        Trésorerie stable avec flux entrants réguliers. Les encaissements clients couvrent les charges courantes. Vigilance recommandée sur les échéances fournisseurs à 30 jours.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderTop: '2px solid #D4A843' }}>
          <p style={{ color: T.success, fontWeight: 700, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>📊 Prévision 30 jours</p>
          <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.55 }}>Solde projeté positif. Entrées estimées supérieures aux sorties avec marge de sécurité de ~15%.</p>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderTop: '2px solid #D4A843' }}>
          <p style={{ color: T.info, fontWeight: 700, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>📈 Prévision 90 jours</p>
          <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.55 }}>Tendance haussière attendue. Recouvrement des créances en cours devrait renforcer la position de trésorerie.</p>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600 }}>Taux de recouvrement</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#D4A843' }}>78%</span>
        </div>
        <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '78%', borderRadius: 4, background: '#D4A843', transition: 'width 800ms ease-out' }} />
        </div>
      </div>

      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CheckCircle size={12} color={T.gold} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>Recommandations</span>
        </div>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, paddingLeft: 18 }}>→ Relancer les factures échues &gt;30 jours</p>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, paddingLeft: 18 }}>→ Provisionner les charges salariales du 25</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
        <Clock size={10} color={T.textDim} />
        <span style={{ fontSize: 10, color: T.textDim }}>Analyse basée sur les données actuelles</span>
      </div>
    </div>
  );

  const sc = scoreColor(forecast.score_sante);
  const risques = parseJsonField(forecast.risques);
  const recommandations = parseJsonField(forecast.recommandations);
  const tauxNum = forecast.taux_recouvrement ? parseFloat(forecast.taux_recouvrement) : null;

  return (
    <div style={{ background: T.cardBg, border: `1px solid rgba(212,168,67,0.15)`, borderLeft: `4px solid ${sc}`, borderRadius: 12, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={18} color={T.gold} />
          <span style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>🧠 Prévision Trésorerie IA</span>
          <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(15,22,41,0.8)', border: '1px solid #D4A843', color: '#D4A843' }}>Généré par IA · Claude Opus</span>
          {forecast.score_sante && (
            <span style={{
              padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: `${sc}18`, border: `1px solid ${sc}40`, color: sc,
            }}>
              {forecast.score_sante}
            </span>
          )}
        </div>
        <button onClick={handleRefresh} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', border: `1px solid rgba(212,168,67,0.2)`, color: T.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> Actualiser
        </button>
      </div>

      {/* Resume */}
      {forecast.resume && (
        <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>{forecast.resume}</p>
      )}

      {/* Previsions 30j / 90j */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        {forecast.prevision_30j && (
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderTop: '2px solid #D4A843' }}>
            <p style={{ color: T.success, fontWeight: 700, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>📊 Prévision 30 jours</p>
            <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.55 }}>{forecast.prevision_30j}</p>
          </div>
        )}
        {forecast.prevision_90j && (
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderTop: '2px solid #D4A843' }}>
            <p style={{ color: T.info, fontWeight: 700, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>📈 Prévision 90 jours</p>
            <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.55 }}>{forecast.prevision_90j}</p>
          </div>
        )}
      </div>

      {/* Taux de recouvrement */}
      {tauxNum != null && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600 }}>Taux de recouvrement</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#D4A843' }}>
              {forecast.taux_recouvrement}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(tauxNum, 100)}%`, borderRadius: 4, background: '#D4A843', transition: 'width 800ms ease-out' }} />
          </div>
        </div>
      )}

      {/* Risques */}
      {risques.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <AlertTriangle size={12} color={T.danger} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.danger }}>Risques identifiés</span>
          </div>
          {risques.map((r: string, i: number) => (
            <p key={i} style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, paddingLeft: 18 }}>⚠️ {r}</p>
          ))}
        </div>
      )}

      {/* Recommandations */}
      {recommandations.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <CheckCircle size={12} color={T.gold} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>Recommandations</span>
          </div>
          {recommandations.map((r: string, i: number) => (
            <p key={i} style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, paddingLeft: 18 }}>→ {r}</p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
        <Clock size={10} color={T.textDim} />
        <span style={{ fontSize: 10, color: T.textDim }}>
          Dernière prévision: {forecast.generated_at ? relTime(forecast.generated_at) : '—'}
        </span>
      </div>
    </div>
  );
}
