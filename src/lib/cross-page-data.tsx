/**
 * Cross-Page Data Consistency Utilities
 * 
 * Centralized constants and visual helpers to ensure data consistency
 * across all pages of the TBOS application.
 */

import React from 'react';

// ─── Consistent Demo Data Constants ───
export const DEMO = {
  // Production
  PRODUCTION_VOLUME_M3: 671,
  PRODUCTION_BATCHES: 14,
  PRODUCTION_CONFORMITY: 96.8,
  
  // Weather
  WEATHER_SAT_TEMP: '38°C',
  WEATHER_SAT_LABEL: 'Risque fissuration',
  WEATHER_MON_TEMP: '22°C',
  WEATHER_MON_LABEL: 'Pluie',
  
  // Stock levels
  STOCK_ADJUVANT_PCT: 10,
  STOCK_CIMENT_PCT: 53,
  STOCK_SABLE_PCT: 72,
  STOCK_GRAVETTE_PCT: 45,
  STOCK_EAU_PCT: 89,
  
  // Fleet
  T09_STATUS: 'Maintenance' as const,
  T09_IS_AVAILABLE: false,
  
  // Sigma Bâtiment scores
  SIGMA_HEALTH_SCORE: 23,
  SIGMA_PAYMENT_SCORE: 12,
  SIGMA_CHANTIER_SCORE: 23,
  SIGMA_DEFAULT_PROBABILITY: 73,
} as const;

// ─── Flagged Clients (problematic) ───
const FLAGGED_CLIENTS = ['Sigma Bâtiment'];

export function isClientFlagged(clientName: string): boolean {
  return FLAGGED_CLIENTS.some(f => clientName.includes(f));
}

/**
 * Red risk dot (6px) placed before a problematic client's name.
 * Use in any table row or mention of a flagged client.
 */
export function ClientRiskDot({ name }: { name: string }) {
  if (!isClientFlagged(name)) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#EF4444',
        marginRight: 5,
        flexShrink: 0,
        boxShadow: '0 0 4px rgba(239,68,68,0.4)',
      }}
      title="Client à risque"
    />
  );
}

/**
 * Renders a client name with the risk dot prepended if flagged.
 */
export function FlaggedClientName({ name, style }: { name: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      <ClientRiskDot name={name} />
      {name}
    </span>
  );
}

/**
 * Cross-page reference hint: a subtle "→ Page" breadcrumb.
 * NOT a navigation link — just a visual indicator of intelligence flow.
 */
export function CrossPageHint({ page }: { page: string }) {
  return (
    <span
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: 10,
        color: 'rgba(212, 168, 67, 0.4)',
        marginLeft: 4,
        userSelect: 'none',
      }}
    >
      → {page}
    </span>
  );
}

/**
 * Formats an AI agent cross-reference string with page names highlighted.
 * Usage: <CrossRef page="Clients" /> renders "(Clients)" in gold-dim color.
 */
export function CrossRef({ page }: { page: string }) {
  return (
    <span
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        color: 'rgba(212, 168, 67, 0.5)',
      }}
    >
      ({page})
    </span>
  );
}
