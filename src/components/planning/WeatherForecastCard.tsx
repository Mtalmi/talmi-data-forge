import React from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold: '#FFD700',
  cardBorder: '#1E2D4A',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

function formatDayLabel(date: Date): string {
  const raw = format(date, 'EEE d MMM', { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const baseForecast = [
  { offset: 0, icon: '☀️', meteo: 'Ensoleillé', temp: '34°C', impact: '✅ Normal', impactColor: T.success, chantiers: 0 },
  { offset: 1, icon: '🌡️', meteo: 'Canicule', temp: '38°C', impact: '⚠️ Modéré', impactColor: T.warning, chantiers: 3 },
  { offset: 2, icon: '🌧️', meteo: 'Pluie', temp: '22°C', impact: '🔴 Élevé', impactColor: T.danger, chantiers: 5 },
];

export function WeatherForecastCard() {
  const today = new Date();
  const forecast = baseForecast.map(f => ({
    ...f,
    jour: formatDayLabel(addDays(today, f.offset)),
  }));

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <p style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
        Prévisions Météo — Impact Chantiers
      </p>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr 0.8fr 0.8fr',
        gap: 0, borderBottom: `1px solid ${T.cardBorder}`, paddingBottom: 8, marginBottom: 4,
      }}>
        {['Jour', 'Météo', 'Temp', 'Impact', 'Risques'].map(h => (
          <span key={h} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {forecast.map((f, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr 0.8fr 0.8fr',
          gap: 0, padding: '10px 0',
          borderBottom: i < forecast.length - 1 ? `1px solid ${T.cardBorder}60` : 'none',
          alignItems: 'center',
        }}>
          <span style={{ color: T.textPri, fontSize: 12, fontWeight: 600 }}>{f.jour}</span>
          <span style={{ color: T.textSec, fontSize: 12 }}>{f.icon} {f.meteo}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.textPri }}>{f.temp}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: f.impactColor }}>{f.impact}</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
            color: f.chantiers > 0 ? f.impactColor : T.textDim,
          }}>
            {f.chantiers}
          </span>
        </div>
      ))}
    </div>
  );
}
