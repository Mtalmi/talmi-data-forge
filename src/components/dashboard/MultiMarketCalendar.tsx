import { useNavigate } from 'react-router-dom';
const M     = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
const GOLD  = '#D4A843';
const AMBER = '#F59E0B';
const RED   = '#EF4444';
const GREEN = '#22C55E';
const GRAY  = '#9CA3AF';
const WHITE = '#FFFFFF';

const Badge = () => (
  <span style={{ fontFamily: M, fontSize: 9, color: GOLD, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
    ✨ Généré par IA · Claude Opus
  </span>
);

interface Evt { icon: string; label: string; color: string; desc: string }

const marocEvents: Evt[] = [
  { icon: '☪', label: 'Ramadan: 21 mars → 19 avril', color: GOLD, desc: '−30% production, horaires 06h-14h' },
  { icon: '🕌', label: 'Aïd al-Fitr: 20-21 avril', color: AMBER, desc: 'Arrêt production 2j — planifier stocks' },
  { icon: '☪', label: 'Aïd al-Adha: 7-8 juin', color: AMBER, desc: 'Arrêt production 2j' },
  { icon: '🏛', label: 'Fête du Trône: 30 juillet', color: GRAY, desc: 'Jour férié — 1j arrêt' },
  { icon: '🌡', label: 'Pic chaleur: juin-août', color: AMBER, desc: 'Adjuvant retardateur systématique' },
];

const euEvents: Evt[] = [
  { icon: '🐣', label: 'Pâques: 5-6 avril', color: AMBER, desc: 'Arrêt chantiers 2-4j selon pays' },
  { icon: '✝️', label: 'Ascension: 14 mai', color: GRAY, desc: 'Pont possible — livraisons réduites' },
  { icon: '🌴', label: 'Congés d\'été: juillet-août', color: RED, desc: '−40% volume chantiers, planifier maintenance flotte' },
  { icon: '🎄', label: 'Noël: 25 déc → 2 jan', color: RED, desc: 'Arrêt quasi-total 10j — stock anticipé novembre' },
  { icon: '📋', label: 'Réglementation EN 206: audits février & septembre', color: GOLD, desc: '' },
  { icon: '⛈', label: 'Gel hivernal: déc-fév', color: AMBER, desc: 'Béton antigel requis <5°C' },
];

const usEvents: Evt[] = [
  { icon: '🇺🇸', label: 'Memorial Day: 25 mai', color: GRAY, desc: 'Week-end 3j — chantiers fermés' },
  { icon: '🇺🇸', label: 'Independence Day: 4 juillet', color: GRAY, desc: 'Jour férié — planifier livraisons 2-3 juillet' },
  { icon: '🇺🇸', label: 'Labor Day: 1 septembre', color: AMBER, desc: 'Fin saison haute construction' },
  { icon: '🦃', label: 'Thanksgiving: 27-28 novembre', color: AMBER, desc: '2j arrêt + vendredi lent' },
  { icon: '🎄', label: 'Christmas-New Year: 24 déc → 2 jan', color: RED, desc: 'Arrêt quasi-total 10j' },
  { icon: '❄️', label: 'Saison gel: nov-mars (Nord)', color: AMBER, desc: 'ACI 306 cold weather specs — additifs requis' },
  { icon: '🌪', label: 'Saison ouragans: juin-nov (Sud-Est)', color: AMBER, desc: 'Risque disruption supply chain' },
  { icon: '📋', label: 'ASTM C94 compliance: audits trimestriels', color: GOLD, desc: '' },
];

function EventList({ events }: { events: Evt[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.map((e, i) => (
        <div key={i} style={{ fontFamily: M, fontSize: 11, lineHeight: 1.5 }}>
          <span style={{ color: e.color }}>{e.icon} {e.label}</span>
          {e.desc && <span style={{ color: GRAY }}> — {e.desc}</span>}
        </div>
      ))}
    </div>
  );
}

const certifications = [
  { market: '🇲🇦 Maroc', norm: 'NM 10.1.008', desc: 'Béton spécification', status: 'Conforme', statusColor: GREEN, statusLabel: '✓ Conforme', action: 'Test #3 planifié 20 mars', progress: 100 },
  { market: '🇲🇦 Maroc', norm: 'NM 10.1.271', desc: 'Essais affaissement', status: 'Urgent', statusColor: RED, statusLabel: '⚠ 26j restants', action: 'URGENT: 0/2 tests', progress: 0 },
  { market: '🇪🇺 Europe', norm: 'EN 206-1', desc: 'Béton spécification', status: 'À obtenir', statusColor: AMBER, statusLabel: 'À obtenir', action: 'Audit initial requis', progress: 15 },
  { market: '🇪🇺 Europe', norm: 'CE Marking', desc: 'Marquage conformité', status: 'À obtenir', statusColor: AMBER, statusLabel: 'À obtenir', action: 'Dossier en préparation', progress: 25 },
  { market: '🇺🇸 USA', norm: 'ASTM C94', desc: 'Ready-mixed concrete', status: 'À obtenir', statusColor: AMBER, statusLabel: 'À obtenir', action: 'Documentation en cours', progress: 10 },
  { market: '🇺🇸 USA', norm: 'ACI 318', desc: 'Structural concrete code', status: 'À obtenir', statusColor: AMBER, statusLabel: 'À obtenir', action: 'Formation requise', progress: 5 },
];

const timelineMarkers = [
  { day: 0, label: '14 mars: 🌡 38°C', color: AMBER },
  { day: 7, label: '21 mars: ☪ Ramadan début', color: GOLD },
  { day: 22, label: '5 avril: 🐣 Pâques EU', color: AMBER },
  { day: 30, label: '13 avril: ☪ fin Ramadan approche', color: GOLD },
];

export function MultiMarketCalendar() {
  return (
    <div className="mb-3 space-y-3">
      {/* ═══ 1. CALENDRIER OPÉRATIONNEL ═══ */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(212,168,67,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${GOLD}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
            <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', color: WHITE }}>CALENDRIER OPÉRATIONNEL — MULTI-MARCHÉS</span>
          </div>
          <Badge />
        </div>

        {/* 3 columns */}
        <div className="grid grid-cols-3 px-5 pb-4">
          {[
            { flag: '🇲🇦', title: 'MAROC & MENA', events: marocEvents },
            { flag: '🇪🇺', title: 'EUROPE', events: euEvents },
            { flag: '🇺🇸', title: 'ÉTATS-UNIS', events: usEvents },
          ].map((col, ci) => (
            <div key={col.title} style={{ paddingRight: ci < 2 ? 16 : 0, paddingLeft: ci > 0 ? 16 : 0, borderRight: ci < 2 ? '1px solid rgba(212,168,67,0.06)' : 'none' }}>
              <div style={{ fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', color: GOLD, marginBottom: 10 }}>
                {col.flag} {col.title}
              </div>
              <EventList events={col.events} />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 2. NEXT 30 DAYS TIMELINE ═══ */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px' }}>
        <div style={{ position: 'relative', height: 56 }}>
          {/* Bar */}
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
          {/* Day ticks */}
          {Array.from({ length: 31 }, (_, i) => {
            const pct = (i / 30) * 100;
            const marker = timelineMarkers.find(m => m.day === i);
            return (
              <div key={i} style={{ position: 'absolute', left: `${pct}%`, top: 0 }}>
                {/* Tick */}
                <div style={{ width: 1, height: marker ? 18 : 6, background: marker ? marker.color : 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)' }} />
                {/* Label */}
                {marker && (
                  <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: M, fontSize: 9, color: marker.color, fontWeight: 600 }}>
                    {marker.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Summary */}
        <div style={{ fontFamily: M, fontSize: 11, color: GRAY, marginTop: 4 }}>
          Jours opérationnels ce mois: <span style={{ color: WHITE, fontWeight: 600 }}>22/31</span> · Capacité effective: <span style={{ color: WHITE, fontWeight: 600 }}>78%</span> · Actions requises: <span style={{ color: RED, fontWeight: 600 }}>3</span>
        </div>
      </div>

      {/* ═══ 3. AI IMPACT ANALYSIS ═══ */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(212,168,67,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${GOLD}`, padding: '16px 20px' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
            <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '1px', color: WHITE }}>ANALYSE D'IMPACT MULTI-MARCHÉS</span>
          </div>
          <Badge />
        </div>
        <p style={{ fontFamily: M, fontSize: 11, color: GRAY, lineHeight: 1.7, margin: '0 0 10px' }}>
          Mars-Avril 2026 : Le Ramadan (21 mars) réduira la capacité <span style={{ color: GOLD, fontWeight: 600 }}>MENA</span> de <span style={{ color: GOLD, fontWeight: 600 }}>30%</span>. Simultanément, Pâques (5 avril) ralentira les chantiers européens de <span style={{ color: GOLD, fontWeight: 600 }}>15%</span>. Fenêtre d'opportunité : les 7 jours avant Ramadan (14-20 mars) sont la dernière fenêtre de production pleine — <span style={{ color: WHITE, fontWeight: 700 }}>maximiser les livraisons cette semaine</span>. Post-Ramadan (mi-avril) : pic historique <span style={{ color: GOLD, fontWeight: 600 }}>+40%</span> — préparer stocks ciment et adjuvant dès maintenant. Marché <span style={{ color: GOLD, fontWeight: 600 }}>US</span> non-affecté en mars — prioriser les commandes US pendant le ralentissement <span style={{ color: GOLD, fontWeight: 600 }}>MENA</span>/<span style={{ color: GOLD, fontWeight: 600 }}>EU</span>.
        </p>
        <p style={{ fontFamily: M, fontSize: 11, color: GRAY, lineHeight: 1.7, margin: 0, borderLeft: `3px solid ${GOLD}`, paddingLeft: 12, background: 'rgba(212,168,67,0.04)', borderRadius: '0 6px 6px 0', padding: '8px 12px' }}>
          Recommandation stockage anticipé : Commander <span style={{ color: GOLD, fontWeight: 600 }}>+20% ciment</span> et <span style={{ color: GOLD, fontWeight: 600 }}>+30% adjuvant</span> avant le 18 mars pour couvrir la reprise post-Ramadan sans risque de rupture. Coût supplémentaire estimé : <span style={{ color: GOLD, fontWeight: 600 }}>18,000 DH</span>. Revenu protégé : <span style={{ color: GOLD, fontWeight: 600 }}>240,000 DH</span> de commandes post-Ramadan.
        </p>
      </div>

      {/* ═══ 4. NORMES & CERTIFICATIONS ═══ */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${GOLD}` }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
            <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '1px', color: WHITE }}>NORMES & CERTIFICATIONS PAR MARCHÉ</span>
          </div>
          <Badge />
        </div>

        <div className="px-5 pb-4">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: M, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['MARCHÉ', 'NORME', 'DESCRIPTION', 'STATUT', 'PROCHAINE ACTION'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: GRAY, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certifications.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,215,0,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', color: WHITE, fontWeight: 600 }}>{c.market}</td>
                  <td style={{ padding: '10px 12px', color: GOLD, fontWeight: 600 }}>{c.norm}</td>
                  <td style={{ padding: '10px 12px', color: GRAY }}>{c.desc}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontFamily: M, fontSize: 10, fontWeight: 600,
                      color: c.statusColor,
                      border: `1px solid ${c.statusColor}`,
                      borderRadius: 12, padding: '2px 8px',
                      ...(c.status === 'Urgent' ? { animation: 'pulse-alert 2s ease-in-out infinite' } : {}),
                    }}>
                      {c.statusLabel}
                    </span>
                    {c.status === 'À obtenir' && (
                      <div style={{ marginTop: 4, width: 60, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${c.progress}%`, height: '100%', background: AMBER, borderRadius: 2 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: c.status === 'Urgent' ? RED : GRAY, fontWeight: c.status === 'Urgent' ? 600 : 400 }}>{c.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
