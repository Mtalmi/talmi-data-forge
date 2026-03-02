import { Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import GlobalHealthHero from '@/components/design-guardian/GlobalHealthHero';
import PageScoresHeatmap from '@/components/design-guardian/PageScoresHeatmap';
import TopIssues from '@/components/design-guardian/TopIssues';
import DimensionRadarChart from '@/components/design-guardian/DimensionRadarChart';
import ConsistencyMatrix from '@/components/design-guardian/ConsistencyMatrix';
import QualityTrendChart from '@/components/design-guardian/QualityTrendChart';
import FixPromptGenerator from '@/components/design-guardian/FixPromptGenerator';
import AuditConfiguration from '@/components/design-guardian/AuditConfiguration';

const gold = 'rgba(255,215,0,0.5)';
const goldGrad = 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)';
const goldGradR = 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3))';

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="h-px flex-1" style={{ background: goldGrad }} />
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: gold }}>{label}</span>
      <div className="h-px flex-1" style={{ background: goldGradR }} />
    </div>
  );
}

export default function DesignGuardian() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7" style={{ color: '#FFD700' }} />
            TBOS Design Guardian
            <Sparkles className="w-4 h-4 text-yellow-400/60" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">Audit visuel agence · Contrôle qualité 10 dimensions · 17 pages</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Agent Actif
          </span>
          <button
            onClick={() => toast.info('Scan lancé — résultats dans ~3 min')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)' }}
          >
            Lancer Scan
          </button>
          <span className="text-xs text-slate-500">Il y a 2h</span>
        </div>
      </div>

      {/* S1: Global Health */}
      <SectionHeader label="Score Global" />
      <GlobalHealthHero />

      {/* S2: Page Scores Heatmap */}
      <SectionHeader label="Score par Page — Vue d'Ensemble" />
      <PageScoresHeatmap />

      {/* S3: Top Issues */}
      <SectionHeader label="Problèmes Prioritaires" />
      <TopIssues />

      {/* S4: Radar Chart */}
      <SectionHeader label="Analyse Multi-Dimensionnelle — Score Moyen" />
      <DimensionRadarChart />

      {/* S5: Consistency Matrix */}
      <SectionHeader label="Matrice de Cohérence Cross-Page" />
      <ConsistencyMatrix />

      {/* S6: Trend Chart */}
      <SectionHeader label="Tendance Qualité — 30 Jours" />
      <QualityTrendChart />

      {/* S7: Fix Prompt Generator */}
      <SectionHeader label="Générateur de Prompts Correctifs" />
      <FixPromptGenerator />

      {/* S8: Configuration */}
      <AuditConfiguration />
    </div>
  );
}
