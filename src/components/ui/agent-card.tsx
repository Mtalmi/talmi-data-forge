/**
 * TBOS Unified AI Agent Visual Components
 * Standard pattern for all AI agent sections across the application.
 */
import React, { ReactNode } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ── Severity colors ── */
type Severity = 'operational' | 'predictive' | 'warning' | 'critical';

const SEVERITY_COLORS: Record<Severity, string> = {
  operational: '#22C55E',
  predictive: '#D4A843',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const SEVERITY_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  forensique: { label: 'FORENSIQUE', bg: 'rgba(239,68,68,0.08)', color: '#EF4444' },
  preventif: { label: 'PRÉVENTIF', bg: 'rgba(34,197,94,0.08)', color: '#22C55E' },
  live: { label: '● LIVE', bg: 'rgba(34,197,94,0.08)', color: '#22C55E' },
  optimisation: { label: 'OPTIMISATION', bg: 'rgba(212,168,67,0.08)', color: '#D4A843' },
  alerte: { label: 'ALERTE', bg: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
  predictif: { label: 'PRÉDICTIF', bg: 'rgba(212,168,67,0.08)', color: '#D4A843' },
};

/* ══════════════════════════════════════════════════════════════════
   1. AgentContainer — wraps each agent section
   ══════════════════════════════════════════════════════════════════ */
interface AgentContainerProps {
  children: ReactNode;
  severity?: Severity;
  index?: number;
  className?: string;
}

export function AgentContainer({ children, severity = 'predictive', index, className }: AgentContainerProps) {
  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }} className={className}>
      {/* Numbered left indicator */}
      {index !== undefined && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 28,
          flexShrink: 0,
          paddingTop: 14,
          marginRight: 12,
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '1px solid rgba(212, 168, 67, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: MONO,
            fontSize: 12,
            color: '#D4A843',
            flexShrink: 0,
          }}>
            {index}
          </div>
          <div style={{
            width: 1,
            flex: 1,
            background: 'linear-gradient(180deg, rgba(212, 168, 67, 0.2), transparent)',
            marginTop: 6,
          }} />
        </div>
      )}

      {/* Agent card */}
      <div style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.015)',
        border: '1px solid rgba(212, 168, 67, 0.08)',
        borderRadius: 10,
        padding: 24,
        borderTop: `3px solid ${SEVERITY_COLORS[severity]}`,
        minWidth: 0,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. AgentHeader — header row with name + badges
   ══════════════════════════════════════════════════════════════════ */
interface AgentHeaderProps {
  name: string;
  severityBadge?: keyof typeof SEVERITY_LABELS;
  hideBranding?: boolean;
}

export function AgentHeader({ name, severityBadge, hideBranding }: AgentHeaderProps) {
  const badge = severityBadge ? SEVERITY_LABELS[severityBadge] : null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 20,
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: '2px',
        color: '#D4A843',
        fontWeight: 400,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        ✦ AGENT IA: {name}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {badge && (
          <span style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.color}40`,
            borderRadius: 100,
            padding: '3px 10px',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            {badge.label}
          </span>
        )}
        {!hideBranding && (
          <span style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 600,
            color: '#D4A843',
            background: 'rgba(212,168,67,0.06)',
            border: '1px solid rgba(212,168,67,0.3)',
            borderRadius: 100,
            padding: '3px 10px',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            Généré par IA · Claude Opus
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3. AgentKPITriplet — 3 KPI cards in a row
   ══════════════════════════════════════════════════════════════════ */
interface AgentKPI {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
}

export function AgentKPITriplet({ kpis }: { kpis: [AgentKPI, AgentKPI, AgentKPI] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
    }}>
      {kpis.map((kpi, i) => (
        <div key={i} style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(212, 168, 67, 0.06)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '1.5px',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {kpi.label}
          </div>
          <div style={{
            fontFamily: MONO,
            fontWeight: 200,
            fontSize: 28,
            color: kpi.color || '#FFFFFF',
            lineHeight: 1.1,
          }}>
            {kpi.value}
          </div>
          {kpi.subtitle && (
            <div style={{
              fontFamily: MONO,
              fontSize: 12,
              color: '#9CA3AF',
              marginTop: 4,
            }}>
              {kpi.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   4. AgentRecommendation — bordered recommendation box
   ══════════════════════════════════════════════════════════════════ */
type RecommendationSeverity = 'gold' | 'red' | 'green' | 'amber';

const REC_COLORS: Record<RecommendationSeverity, string> = {
  gold: '#D4A843',
  red: '#EF4444',
  green: '#22C55E',
  amber: '#F59E0B',
};

interface AgentRecommendationProps {
  children: ReactNode;
  severity?: RecommendationSeverity;
  title?: string;
}

export function AgentRecommendation({ children, severity = 'gold', title }: AgentRecommendationProps) {
  const color = REC_COLORS[severity];
  // Convert hex to rgba at 0.03 opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div style={{
      borderLeft: `4px solid ${color}`,
      background: hexToRgba(color, 0.03),
      padding: 16,
      borderRadius: '0 8px 8px 0',
      marginTop: 16,
    }}>
      {title && (
        <div style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '1.5px',
          color,
          textTransform: 'uppercase',
          marginBottom: 8,
          fontWeight: 600,
        }}>
          {title}
        </div>
      )}
      <div style={{
        fontFamily: MONO,
        fontSize: 13,
        color: '#9CA3AF',
        lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   5. AgentGrid — wrapper for agent list with 32px spacing
   ══════════════════════════════════════════════════════════════════ */
export function AgentGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   6. IntelligenceTabHeader — standard header for IA tabs
   ══════════════════════════════════════════════════════════════════ */
interface IntelligenceTabHeaderProps {
  domain: string;
  agentCount: number;
  summaryCards?: [AgentKPI, AgentKPI, AgentKPI];
}

export function IntelligenceTabHeader({ domain, agentCount, summaryCards }: IntelligenceTabHeaderProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: MONO,
        letterSpacing: '2px',
        fontSize: 14,
        color: '#D4A843',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        ✦ CENTRE D&apos;INTELLIGENCE {domain}
      </div>
      <div style={{
        fontFamily: MONO,
        fontSize: 12,
        color: '#D4A843',
        opacity: 0.7,
        marginBottom: 20,
      }}>
        {agentCount} agents actifs · Surveillance continue · Claude Opus
      </div>
      {summaryCards && <AgentKPITriplet kpis={summaryCards} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Highlight helpers for recommendation text
   ══════════════════════════════════════════════════════════════════ */
export function GoldText({ children }: { children: ReactNode }) {
  return <strong style={{ color: '#D4A843', fontWeight: 600 }}>{children}</strong>;
}

export function DangerText({ children }: { children: ReactNode }) {
  return <strong style={{ color: '#EF4444', fontWeight: 600 }}>{children}</strong>;
}
