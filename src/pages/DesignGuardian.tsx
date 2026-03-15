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

const MONO = 'ui-monospace, SFMono-Regular, monospace';

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-0 mb-4 mt-2">
      <span style={{ color: '#D4A843', fontSize: 14, marginRight: 8, flexShrink: 0 }}>✦</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#D4A843',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          borderBottom: '1px dashed rgba(212, 168, 67, 0.2)',
          flexGrow: 1,
          marginLeft: 12,
          alignSelf: 'center',
          height: 0,
        }}
      />
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
            <Shield className="w-7 h-7" style={{ color: '#D4A843' }} />
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
            style={{ background: 'linear-gradient(135deg, #D4A843, #C49A3C)' }}
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
