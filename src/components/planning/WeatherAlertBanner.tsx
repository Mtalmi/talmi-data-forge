import React, { useState } from 'react';
import { Thermometer, X } from 'lucide-react';

const T = {
  gold: '#FFD700',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
};

export function WeatherAlertBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(249,115,22,0.10))',
      borderLeft: '4px solid #F59E0B',
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 24,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Thermometer size={18} color="#F59E0B" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: T.textPri, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
          ⛅ Alerte Météo IA — Demain 38°C prévu. Recommandation: utiliser adjuvant retardateur pour livraisons après 11h. 3 chantiers à risque identifiés.
        </p>
      </div>
      <button
        onClick={() => {/* scroll or navigate to forecast */}}
        style={{
          padding: '5px 14px', borderRadius: 6,
          background: 'transparent', border: '1px solid rgba(245,158,11,0.3)',
          color: T.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Voir Détails
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 4, flexShrink: 0, color: T.textSec,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
