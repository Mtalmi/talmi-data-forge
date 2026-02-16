import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { PeriodStats } from '@/hooks/useDashboardStatsWithPeriod';
import { DashboardStats } from '@/hooks/useDashboardStats';

interface AIInsightsWidgetProps {
  periodStats: PeriodStats;
  dashboardStats: DashboardStats;
}

interface Insight {
  type: 'positive' | 'warning' | 'recommendation';
  text: string;
}

const CACHE_KEY = 'tbos_ai_insights';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export function AIInsightsWidget({ periodStats, dashboardStats }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Try loading from cache first
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { insights: cachedInsights, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setInsights(cachedInsights);
          setLastUpdate(new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
          return;
        }
      }
    } catch {}
  }, []);

  const fetchInsights = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const kpiSummary = `
Volume: ${periodStats.totalVolume.toFixed(0)} m³ (${periodStats.volumeTrend > 0 ? '+' : ''}${periodStats.volumeTrend.toFixed(1)}% vs M-1)
CA: ${(periodStats.chiffreAffaires / 1000).toFixed(1)}K MAD (${periodStats.caTrend > 0 ? '+' : ''}${periodStats.caTrend.toFixed(1)}%)
Marge Brute: ${periodStats.margeBrutePct.toFixed(1)}% (${periodStats.margeTrend > 0 ? '+' : ''}${periodStats.margeTrend.toFixed(1)}%)
CUR Moyen: ${periodStats.curMoyen.toFixed(2)} DH (${periodStats.curTrend > 0 ? '+' : ''}${periodStats.curTrend.toFixed(1)}%)
Profit Net: ${(periodStats.profitNet / 1000).toFixed(1)}K MAD
Dépenses: ${(periodStats.totalDepenses / 1000).toFixed(1)}K MAD
Livraisons: ${periodStats.nbLivraisons} | Factures: ${periodStats.nbFactures} | Clients: ${periodStats.nbClients}
Alertes Marge: ${dashboardStats.marginAlerts} | Impayés: ${(dashboardStats.pendingPaymentsTotal / 1000).toFixed(0)}K MAD
E/C Ratio: ${dashboardStats.tauxECMoyen.toFixed(3)}
      `.trim();

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          mode: 'validate',
          messages: [
            {
              role: 'user',
              content: `Analyse ces KPIs de la centrale à béton et donne exactement 4 insights structurés en JSON.
              
KPIs du mois:
${kpiSummary}

Réponds UNIQUEMENT en JSON: { "insights": [{ "type": "positive"|"warning"|"recommendation", "text": "insight court max 80 chars" }] }
Maximum 4 insights, classés par importance business.`,
            },
          ],
        },
      });

      if (error) throw error;

      // Parse AI response
      const content = data?.choices?.[0]?.message?.content || '';
      let parsed: { insights: Insight[] };
      
      try {
        // Try direct parse
        parsed = JSON.parse(content);
      } catch {
        // Try extracting JSON from text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid AI response');
        }
      }

      if (parsed?.insights?.length) {
        setInsights(parsed.insights.slice(0, 4));
        const now = Date.now();
        setLastUpdate(new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        localStorage.setItem(CACHE_KEY, JSON.stringify({ insights: parsed.insights.slice(0, 4), timestamp: now }));
      }
    } catch (err) {
      console.error('AI Insights error:', err);
      // Fallback to rule-based insights
      const fallback: Insight[] = [];
      if (periodStats.volumeTrend > 5) fallback.push({ type: 'positive', text: `📈 Volume en hausse de ${periodStats.volumeTrend.toFixed(0)}% — bonne dynamique commerciale` });
      if (periodStats.margeBrutePct < 15) fallback.push({ type: 'warning', text: `⚠️ Marge brute à ${periodStats.margeBrutePct.toFixed(1)}% — sous le seuil de rentabilité cible` });
      if (dashboardStats.pendingPaymentsTotal > 50000) fallback.push({ type: 'warning', text: `💰 ${(dashboardStats.pendingPaymentsTotal / 1000).toFixed(0)}K MAD d'impayés — relancer les clients` });
      if (periodStats.curTrend > 5) fallback.push({ type: 'recommendation', text: `🔍 CUR en hausse de ${periodStats.curTrend.toFixed(1)}% — vérifier les prix matières` });
      if (fallback.length === 0) fallback.push({ type: 'positive', text: '✅ Tous les indicateurs sont dans les normes' });
      setInsights(fallback);
    } finally {
      setLoading(false);
    }
  }, [periodStats, dashboardStats, loading]);

  // Auto-fetch on mount if no cache
  useEffect(() => {
    if (insights.length === 0 && periodStats.nbLivraisons > 0) {
      fetchInsights();
    }
  }, [periodStats.nbLivraisons]);

  const insightIcons = {
    positive: <TrendingUp className="h-3.5 w-3.5 text-success flex-shrink-0" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0" />,
    recommendation: <Lightbulb className="h-3.5 w-3.5 text-primary flex-shrink-0" />,
  };

  const insightBg = {
    positive: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    recommendation: 'bg-primary/5 border-primary/20',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">AI Insights</h3>
            {lastUpdate && <p className="text-[10px] text-muted-foreground">Mis à jour à {lastUpdate}</p>}
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', loading && 'animate-spin')} />
        </button>
      </div>

      {loading && insights.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 animate-pulse">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Analyse AI en cours...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-relaxed',
                insightBg[insight.type]
              )}
            >
              {insightIcons[insight.type]}
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
