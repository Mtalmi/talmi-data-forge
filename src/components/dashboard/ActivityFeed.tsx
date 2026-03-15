import React from 'react';
import { useActivity, type ActivityEntry } from '@/contexts/ActivityContext';
import { useNavigate } from 'react-router-dom';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const SEVERITY_COLOR: Record<string, string> = {
  success: '#22C55E',
  info: '#D4A843',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const SOURCE_COLOR: Record<string, string> = {
  PRODUCTION: '#22C55E',
  LOGISTIQUE: '#3B82F6',
  VENTES: '#D4A843',
  STOCKS: '#F59E0B',
  LABORATOIRE: '#8B5CF6',
  CRÉANCES: '#F97316',
  'INTELLIGENCE IA': '#D4A843',
  SYSTÈME: '#9CA3AF',
};

// Demo seed entries (shown when real activity is sparse)
const SEED_ENTRIES: ActivityEntry[] = [
  { id: 's1', timestamp: new Date(Date.now() - 3 * 60000).toISOString(), type: 'action', message: 'Batch #403-068 complété — F-B25, 8 m³, TGCC. Conformité: ✓', source: 'PRODUCTION', severity: 'success' },
  { id: 's2', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), type: 'system', message: 'Score journée mis à jour: 87/100 (+1)', source: 'SYSTÈME', severity: 'info' },
  { id: 's3', timestamp: new Date(Date.now() - 32 * 60000).toISOString(), type: 'action', message: 'Livraison BL-2024-C1D7 confirmée — Groupe A, 8 m³', source: 'LOGISTIQUE', severity: 'success' },
  { id: 's4', timestamp: new Date(Date.now() - 50 * 60000).toISOString(), type: 'ai', message: 'Agent IA: Relance automatique envoyée — Ciments & Béton du Sud (FAC-2026-090)', source: 'CRÉANCES', severity: 'warning' },
  { id: 's5', timestamp: new Date(Date.now() - 65 * 60000).toISOString(), type: 'alert', message: 'Alerte: T-04 retard +14 min sur livraison Résidences Atlas', source: 'LOGISTIQUE', severity: 'critical' },
  { id: 's6', timestamp: new Date(Date.now() - 90 * 60000).toISOString(), type: 'action', message: 'Test LAB-142 enregistré — Slump 18 cm, Conforme ✓', source: 'LABORATOIRE', severity: 'success' },
  { id: 's7', timestamp: new Date(Date.now() - 110 * 60000).toISOString(), type: 'ai', message: 'Deal Scorer: TGCC score mis à jour 87/100', source: 'VENTES', severity: 'info' },
  { id: 's8', timestamp: new Date(Date.now() - 160 * 60000).toISOString(), type: 'system', message: 'Rapport du Soir généré automatiquement', source: 'INTELLIGENCE IA', severity: 'success' },
  { id: 's9', timestamp: new Date(Date.now() - 195 * 60000).toISOString(), type: 'alert', message: 'Stock Adjuvant: autonomie passée sous 7 jours (6.7j)', source: 'STOCKS', severity: 'warning' },
  { id: 's10', timestamp: new Date(Date.now() - 250 * 60000).toISOString(), type: 'alert', message: 'Non-conformité détectée: Batch BN-0140, Slump +10%', source: 'LABORATOIRE', severity: 'critical' },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ActivityFeed() {
  const { entries } = useActivity();
  const navigate = useNavigate();

  // Merge real entries with seeds, showing real first, then seed to fill 10
  const realEntries = entries.slice(0, 10);
  const needed = 10 - realEntries.length;
  const display = needed > 0 ? [...realEntries, ...SEED_ENTRIES.slice(0, needed)] : realEntries;

  return (
    <div className="rounded-lg overflow-hidden" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: '2px solid #D4A843',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: '#D4A843', fontSize: 14, animation: 'pulse 3s ease-in-out infinite' }}>✦</span>
          <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.5px' }}>ACTIVITÉ RÉCENTE — FIL EN DIRECT</span>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span style={{ fontFamily: MN, fontSize: 9, fontWeight: 600, color: '#22C55E', letterSpacing: '0.5px' }}>LIVE</span>
        </span>
      </div>

      {/* Feed */}
      <div className="px-5 pb-2">
        {display.map((entry, i) => {
          const dotColor = SEVERITY_COLOR[entry.severity] || '#9CA3AF';
          const srcColor = SOURCE_COLOR[entry.source] || '#9CA3AF';
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 0',
                borderBottom: i < display.length - 1 ? '1px solid rgba(212,168,67,0.03)' : 'none',
                ...(entry.isNew ? {
                  animation: 'activitySlideIn 300ms ease-out',
                  background: 'rgba(212,168,67,0.08)',
                  transition: 'background 1s ease-out',
                } : {}),
              }}
            >
              {/* Timestamp */}
              <span style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF', minWidth: 38, flexShrink: 0, paddingTop: 1 }}>
                {formatTime(entry.timestamp)}
              </span>
              {/* Dot */}
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: dotColor,
                flexShrink: 0, marginTop: 5,
                boxShadow: `0 0 6px ${dotColor}40`,
              }} />
              {/* Message */}
              <span style={{ fontFamily: MN, fontSize: 11, color: '#E2E8F0', lineHeight: 1.5, flex: 1 }}>
                {entry.message}
              </span>
              {/* Source badge */}
              <span style={{
                fontFamily: MN, fontSize: 9, fontWeight: 600,
                color: srcColor, border: `1px solid ${srcColor}40`,
                borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0,
                letterSpacing: '0.5px',
              }}>
                {entry.source}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 20px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/journal')}
          style={{
            fontFamily: MN, fontSize: 11, color: '#D4A843', background: 'transparent',
            border: 'none', cursor: 'pointer', letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
        >
          Voir tout l'historique →
        </button>
      </div>

      <style>{`
        @keyframes activitySlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
