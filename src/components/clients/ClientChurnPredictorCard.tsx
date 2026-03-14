import React, { useState, useEffect, useRef } from 'react';
import { Users, Sparkles } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B', success: '#10B981', info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
};

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

// Highlight key data in alert text
function HighlightedAlertText({ text }: { text: string }) {
  // Match patterns: percentages, DH amounts, time periods, numbers with units
  const parts = text.split(/((?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?(?:\s*(?:%|MAD|DH|m³\/mois|m³|jours?|j|mois|semaines?))?|(?:il y a \d+ jours?)|\-\d+%|\+\d+%)/g);
  return (
    <p style={{ fontSize: 11, lineHeight: 1.7, color: T.textSec }}>
      {parts.map((part, i) => {
        if (/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(%|MAD|DH|m³|jours?|j|mois|semaines?)/.test(part) || /[\-\+]\d+%/.test(part) || /il y a \d+/.test(part) || /\d+m³\/mois/.test(part)) {
          return <span key={i} style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

const alerts = [
  {
    severity: 'high' as const,
    text: '🔴 Atlas Construction — Volume commandé en baisse de 40% sur 3 mois (de 120m³/mois à 72m³/mois). Dernier contact commercial: il y a 35 jours. Concurrent identifié: BétonPlus propose -5% sur B25. Recommandation: appeler cette semaine, proposer remise fidélité 3%.',
  },
  {
    severity: 'high' as const,
    text: '🔴 Sigma Bâtiment — Aucune commande depuis 28 jours (fréquence habituelle: hebdomadaire). 4 factures impayées totalisant 189,000 MAD. Possible lien entre retards de paiement et arrêt des commandes. Recommandation: réunion direction pour négocier plan de paiement.',
  },
  {
    severity: 'medium' as const,
    text: '⚠️ Omega Immobilier — Volume en baisse progressive de 15% sur 2 mois. Nouveau projet démarré mais pas de commande associée. Recommandation: contacter chef de projet pour le nouveau chantier Hay Hassani.',
  },
];

const kpis = [
  { label: 'Clients Actifs', numValue: 4, displaySuffix: '/6', trend: '↓1 ce mois', trendColor: T.warning },
  { label: 'Risque Perte', numValue: 2, displaySuffix: ' clients', valueColor: T.danger },
  { label: 'Revenue à Risque', numValue: 312000, displaySuffix: '', valueColor: T.danger, isCurrency: true },
  { label: 'Taux Rétention 12M', numValue: 83, displaySuffix: '%', valueColor: T.warning },
];

export function ClientChurnPredictorCard() {
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderTop: '2px solid #EF4444',
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)',
        backgroundSize: '200% 100%',
        animation: 'churn-shimmer 4s ease-in-out infinite',
      }} />
      <style>{`@keyframes churn-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Users size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: MONO }}>
            Agent IA: Prédiction Attrition Clients
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        <span style={{
          background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843',
          fontSize: 11, borderRadius: 9999, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: MONO,
        }}>✨ Généré par IA · Claude Opus</span>
      </div>

      <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {kpis.map((k, i) => (
            <KPIBox key={i} {...k} />
          ))}
        </div>

        {/* Alert cards */}
        <p style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 12, fontFamily: MONO }}>Clients à Risque de Perte — Prédiction IA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((a, i) => {
            const isHigh = a.severity === 'high';
            const bc = isHigh ? T.danger : T.warning;
            return <AlertRow key={i} text={a.text} borderColor={bc} isHigh={isHigh} />;
          })}
        </div>

        {/* Recommandation box */}
        <div style={{
          marginTop: 16,
          borderLeft: '3px solid #D4A843',
          background: 'rgba(212,168,67,0.04)',
          borderRadius: '0 8px 8px 0',
          padding: 16,
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: T.textSec }}>
            <span style={{ color: '#D4A843', fontWeight: 600 }}>Action prioritaire : </span>
            Sigma Bâtiment — <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>4</span> factures impayées totalisant{' '}
            <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>189,000</span> MAD bloquent la relation. Risque de perte définitive sous{' '}
            <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>30 jours</span>. Recommandation : réunion direction cette semaine, proposer plan de paiement échelonné sur{' '}
            <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>3 mois</span> avec engagement de reprise des commandes.
          </p>
        </div>
      </div>
    </div>
  );
}

function KPIBox({ label, numValue, displaySuffix, trend, trendColor, valueColor, isCurrency }: {
  label: string; numValue: number; displaySuffix: string; trend?: string; trendColor?: string; valueColor?: string; isCurrency?: boolean;
}) {
  const animated = useCountUp(isCurrency ? numValue / 1000 : numValue, 1200, 0);
  const color = valueColor || '#D4A843';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', borderRadius: 8,
      border: `1px solid ${T.cardBorder}`, padding: '10px 12px',
    }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, fontFamily: MONO }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontFamily: MONO, fontWeight: 100, fontSize: 36, color, lineHeight: 1 }}>
          {isCurrency ? `${animated.toLocaleString('fr-FR')}` : animated}
        </span>
        {isCurrency ? (
          <span style={{ fontFamily: MONO, fontSize: 16, color: '#9CA3AF', marginLeft: 4 }}>K MAD/an</span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 16, color: '#9CA3AF' }}>{displaySuffix}</span>
        )}
      </div>
      {trend && (
        <span style={{ fontSize: 9, fontWeight: 600, color: trendColor, fontFamily: MONO }}>{trend}</span>
      )}
    </div>
  );
}

function AlertRow({ text, borderColor, isHigh }: { text: string; borderColor: string; isHigh: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(212,168,67,0.04)' : isHigh ? 'rgba(239,68,68,0.03)' : 'rgba(245,158,11,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 8,
        padding: 12,
        transition: 'background 200ms',
      }}
    >
      <HighlightedAlertText text={text} />
    </div>
  );
}
