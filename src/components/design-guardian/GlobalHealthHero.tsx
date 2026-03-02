import { Shield, AlertTriangle, Bug, Lightbulb, CheckCircle } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { AUDIT_PAGES, AUDIT_ISSUES } from './audit-data';

const T = {
  card: 'bg-slate-800/50 border border-slate-700 rounded-xl',
  label: 'text-[10px] uppercase tracking-widest text-slate-500 font-semibold',
  gold: '#FFD700',
};

export default function GlobalHealthHero() {
  const totalPages = AUDIT_PAGES.length;
  const conformPages = AUDIT_PAGES.filter(p => p.score >= 8.0).length;
  const avgScore = +(AUDIT_PAGES.reduce((s, p) => s + p.score, 0) / totalPages).toFixed(1);
  const activeAlerts = AUDIT_ISSUES.filter(i => i.status === 'open').length;
  const criticalCount = AUDIT_ISSUES.filter(i => i.severity === 'critique').length;
  const suggestions = AUDIT_ISSUES.length + 6; // extra suggestions

  const animatedScore = useAnimatedCounter(avgScore, 1500, 1);

  const scoreColor = avgScore >= 8.5 ? 'text-green-400' : avgScore >= 7.0 ? 'text-yellow-400' : 'text-red-400';
  const strokeColor = avgScore >= 8.5 ? '#22c55e' : avgScore >= 7.0 ? '#FFD700' : '#ef4444';

  const circumference = 2 * Math.PI * 54;
  const progress = (avgScore / 10) * circumference;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className={`${T.card} p-8 flex items-center gap-8`}>
        {/* Circular score */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extralight font-mono ${scoreColor}`}>{animatedScore}</span>
            <span className="text-[10px] text-slate-500 font-semibold">/10</span>
          </div>
        </div>
        {/* Info */}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: T.gold }} />
            Score Global
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            21 fonctionnalités IA · {totalPages} pages · Dernière analyse: il y a 2 heures
          </p>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Pages Conformes"
          value={`${conformPages}/${totalPages}`}
          icon={<CheckCircle className="w-4 h-4 text-green-400" />}
          color="text-green-400"
        />
        <KPICard
          label="Alertes Actives"
          value={activeAlerts}
          icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}
          color="text-yellow-400"
        />
        <KPICard
          label="Problèmes Critiques"
          value={criticalCount}
          icon={<Bug className="w-4 h-4 text-red-400" />}
          color="text-red-400"
          pulse
        />
        <KPICard
          label="Améliorations Suggérées"
          value={suggestions}
          icon={<Lightbulb className="w-4 h-4 text-blue-400" />}
          color="text-blue-400"
        />
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, pulse }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; pulse?: boolean;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">{label}</div>
      <div className="flex items-center gap-2">
        {pulse && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
        <span className={`text-3xl font-extralight font-mono ${color}`}>{value}</span>
      </div>
      <div className="mt-1">{icon}</div>
    </div>
  );
}
