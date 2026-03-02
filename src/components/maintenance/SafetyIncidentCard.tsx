import React, { useState } from 'react';
import { Shield, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const T = {
  gold: '#FFD700', goldDim: 'rgba(255,215,0,0.15)',
  danger: '#EF4444', warning: '#F59E0B', success: '#10B981', info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
  cardBorder: '#1E2D4A',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
};

const incidents = [
  { date: '27 Fév', type: 'Quasi-accident', gravite: '🟡 Modérée', gravColor: T.warning, desc: 'Glissade zone de chargement — sol mouillé', statut: '✅ Résolu — marquage ajouté', resolved: true },
  { date: '22 Fév', type: 'Incident mineur', gravite: '🟠 Moyenne', gravColor: T.warning, desc: 'Projection béton — opérateur sans lunettes', statut: '✅ Résolu — rappel EPI', resolved: true },
  { date: '15 Fév', type: 'Quasi-accident', gravite: '🟡 Modérée', gravColor: T.warning, desc: 'Recul camion sans signaleur', statut: '⚠️ En cours — procédure mise à jour', resolved: false },
  { date: '8 Fév', type: 'Maintenance', gravite: '🟢 Faible', gravColor: T.success, desc: 'Fuite hydraulique détectée par opérateur', statut: '✅ Résolu', resolved: true },
  { date: '1 Fév', type: 'Incident mineur', gravite: '🟠 Moyenne', gravColor: T.warning, desc: 'Dépassement niveau sonore zone malaxeur', statut: '✅ Résolu — protections distribuées', resolved: true },
];

const headers = ['Date', 'Type', 'Gravité', 'Description', 'Statut'];

export function SafetyIncidentCard() {
  const [open, setOpen] = useState(true);
  const score = 92;
  const daysNoIncident = 12;
  const goal = 30;

  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Agent IA: Sécurité & Incidents</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        {open ? <ChevronUp size={14} color={T.textDim} /> : <ChevronDown size={14} color={T.textDim} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            <KpiBox label="Score Sécurité" value={`${score}/100`} valueColor={T.success} />
            <KpiBox label="Jours Sans Incident" value={String(daysNoIncident)} valueColor={T.textPri} progress={daysNoIncident / goal} />
            <KpiBox label="Incidents ce Mois" value="2" valueColor={T.warning} />
            <KpiBox label="Taux Conformité EPI" value="94%" valueColor={T.success} />
          </div>

          {/* Safety Score Circle + Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke={T.cardBorder} strokeWidth="6" />
                <circle cx="45" cy="45" r="38" fill="none" stroke={T.success} strokeWidth="6"
                  strokeDasharray={`${(score / 100) * 238.8} 238.8`}
                  strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 800, color: T.success }}>{score}</span>
                <span style={{ fontSize: 8, color: T.textDim }}>/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 4 }}>Score Sécurité</p>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 10 }}>{daysNoIncident} jours sans incident | Objectif: {goal} jours</p>
              <div style={{ height: 6, borderRadius: 3, background: `${T.cardBorder}`, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(daysNoIncident / goal) * 100}%`, borderRadius: 3, background: `linear-gradient(90deg, ${T.success}, ${T.success}AA)`, transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>{daysNoIncident}/{goal} jours — {Math.round((daysNoIncident / goal) * 100)}% de l'objectif</p>
            </div>
          </div>

          {/* Incidents Table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => (
                  <tr key={i}
                    style={{ borderBottom: i < incidents.length - 1 ? `1px solid ${T.cardBorder}60` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: T.textPri, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{inc.date}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: `${T.info}15`, color: T.info, border: `1px solid ${T.info}25` }}>{inc.type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: inc.gravColor }}>{inc.gravite}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textSec, maxWidth: 250 }}>{inc.desc}</td>
                    <td style={{ padding: '10px 12px', fontSize: 10, color: inc.resolved ? T.success : T.warning, fontWeight: 600 }}>{inc.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Safety Analysis */}
          <div style={{
            borderLeft: `4px solid ${T.info}`,
            background: `${T.info}06`,
            border: `1px solid ${T.info}20`,
            borderLeftWidth: 4, borderLeftColor: T.info,
            borderRadius: '0 10px 10px 0',
            padding: '14px 18px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 10 }}>🛡️ ANALYSE SÉCURITÉ IA — Février 2026</p>
            <div style={{ fontSize: 11, lineHeight: 1.8, color: T.textSec }}>
              <p style={{ fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Tendances identifiées:</p>
              <p>• 60% des incidents liés à la zone de chargement → <strong style={{ color: T.gold }}>Recommandation: installer caméras de recul sur tous les camions et marquage au sol renforcé</strong></p>
              <p>• 2 incidents liés aux EPI → <strong style={{ color: T.gold }}>Recommandation: contrôle EPI obligatoire à l'entrée (badge scan)</strong></p>
              <p>• Période à risque identifiée: lundis matin (3 des 5 incidents) → <strong style={{ color: T.gold }}>Recommandation: briefing sécurité de 5 min chaque lundi à 7h45</strong></p>
              <p style={{ fontWeight: 600, color: T.textPri, marginTop: 12, marginBottom: 4 }}>Conformité réglementaire Maroc:</p>
              <p>• Décret n°2-12-431: <span style={{ color: T.success }}>✅ Registre à jour</span></p>
              <p>• Code du travail Art. 281-303: <span style={{ color: T.success }}>✅ Conforme</span></p>
              <p>• Formation sécurité annuelle: <span style={{ color: T.warning }}>⚠️ 2 employés à renouveler avant 15 Mars</span></p>
            </div>
          </div>

          {/* Monthly Report Button */}
          <button style={{
            width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: `linear-gradient(135deg, ${T.gold}20, ${T.gold}10)`,
            color: T.gold, border: `1px solid ${T.gold}30`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <FileText size={14} /> 📄 Générer Rapport Mensuel Sécurité
          </button>
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value, valueColor, progress }: { label: string; value: string; valueColor: string; progress?: number }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: `1px solid ${T.cardBorder}`, padding: '10px 12px' }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</p>
      <span style={{ fontSize: 15, fontWeight: 800, color: valueColor, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
      {progress !== undefined && (
        <div style={{ height: 3, borderRadius: 2, background: T.cardBorder, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 2, background: T.success }} />
        </div>
      )}
    </div>
  );
}
