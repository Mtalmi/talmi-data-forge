import React, { useState, useEffect } from 'react';
import { Truck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const T = {
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.15)',
  goldBorder: 'rgba(255,215,0,0.3)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#60A5FA',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  cardBorder: '#1E2D4A',
};

const trucks = [
  { name: '🚛 Camion 1', statut: 'En route', statutColor: T.success, position: 'Km 12/18', chargement: 'B25 — 8m³', eta: '14 min', alerte: '' },
  { name: '🚛 Camion 2', statut: 'Au chantier', statutColor: T.info, position: 'Maarif', chargement: 'B30 — 6m³', eta: 'Déchargement', alerte: '' },
  { name: '🚛 Camion 3', statut: 'Retour usine', statutColor: T.textDim, position: 'Km 5/22', chargement: 'Vide', eta: '18 min', alerte: '' },
  { name: '🚛 Camion 4', statut: 'En attente', statutColor: T.warning, position: 'Usine', chargement: '—', eta: '—', alerte: '⏳ 22 min d\'attente' },
  { name: '🚛 Camion 5', statut: 'En route', statutColor: T.success, position: 'Km 3/15', chargement: 'B25S — 7m³', eta: '28 min', alerte: '⚠️ Béton > 45min' },
];

const headers = ['Camion', 'Statut', 'Position', 'Chargement', 'ETA Chantier', 'Alerte'];

interface Recommendation {
  priority: string;
  borderColor: string;
  text: string;
}

export function DeliveryOrchestrationPanel() {
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [kpis, setKpis] = useState([
    { label: 'Camions Actifs', value: '—' },
    { label: 'Temps Moyen Transit', value: '—' },
    { label: 'Taux Utilisation', value: '—' },
    { label: "Livraisons Aujourd'hui", value: '—' },
  ]);

  useEffect(() => {
    async function load() {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const [activeRes, totalRes, blRes] = await Promise.all([
        supabase.from('prestataires_transport').select('id', { count: 'exact', head: true }).eq('actif', true),
        supabase.from('prestataires_transport').select('id', { count: 'exact', head: true }),
        supabase.from('bons_livraison_reels').select('bl_id, temps_rotation_minutes, workflow_status, updated_at, heure_prevue, date_livraison').eq('date_livraison', todayStr),
      ]);

      const activeTrucks = activeRes.count ?? 0;
      const totalTrucks = totalRes.count ?? 0;
      const todayBLs = blRes.data ?? [];
      const deliveryCount = todayBLs.length;

      const rotations = todayBLs
        .map(b => b.temps_rotation_minutes)
        .filter((v): v is number => v != null && v > 0);
      const avgTransit = rotations.length > 0
        ? Math.round(rotations.reduce((s, v) => s + v, 0) / rotations.length)
        : null;

      const utilization = totalTrucks > 0 ? Math.round((activeTrucks / totalTrucks) * 100) : 0;

      setKpis([
        { label: 'Camions Actifs', value: `${activeTrucks}/${totalTrucks}` },
        { label: 'Temps Moyen Transit', value: avgTransit != null ? `${avgTransit} min` : '--' },
        { label: 'Taux Utilisation', value: `${utilization}%` },
        { label: "Livraisons Aujourd'hui", value: `${deliveryCount}` },
      ]);

      // Build live recommendations
      const now = new Date();
      const recs: Recommendation[] = [];

      // URGENT: en_livraison with updated_at > 40 min ago
      const staleDeliveries = todayBLs.filter(bl => {
        if (bl.workflow_status !== 'en_livraison' || !bl.updated_at) return false;
        const updatedAt = new Date(bl.updated_at);
        const diffMin = (now.getTime() - updatedAt.getTime()) / 60000;
        return diffMin > 40;
      });
      for (const bl of staleDeliveries) {
        const diffMin = Math.round((now.getTime() - new Date(bl.updated_at).getTime()) / 60000);
        recs.push({
          priority: 'high',
          borderColor: T.danger,
          text: `⚠️ URGENT — ${bl.bl_id}: en livraison depuis ${diffMin} min sans mise à jour. Vérifier le statut du camion et contacter le chauffeur.`,
        });
      }

      // OPTIMISATION: planification with heure_prevue within next 2h
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60000);
      const nowTimeStr = format(now, 'HH:mm');
      const twoHStr = format(twoHoursLater, 'HH:mm');
      const upcoming = todayBLs.filter(bl => {
        if (bl.workflow_status !== 'planification' || !bl.heure_prevue) return false;
        const hp = bl.heure_prevue.slice(0, 5);
        return hp >= nowTimeStr && hp <= twoHStr;
      });
      if (upcoming.length > 0) {
        recs.push({
          priority: 'medium',
          borderColor: T.warning,
          text: `💡 OPTIMISATION — ${upcoming.length} livraison${upcoming.length > 1 ? 's' : ''} encore en planification avec départ prévu dans les 2 prochaines heures. Lancer la production et l'assignation camion.`,
        });
      }

      // PRÉVISION: deliveries after 14h
      const after14h = todayBLs.filter(bl => {
        if (!bl.heure_prevue) return false;
        return bl.heure_prevue.slice(0, 2) >= '14';
      });
      if (after14h.length > 0) {
        recs.push({
          priority: 'info',
          borderColor: T.info,
          text: `📊 PRÉVISION — ${after14h.length} livraison${after14h.length > 1 ? 's' : ''} planifiée${after14h.length > 1 ? 's' : ''} après 14h. Anticiper la disponibilité des camions pour le pic d'après-midi.`,
        });
      }

      setRecommendations(recs);
    }
    load();
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: T.goldDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Truck size={14} color={T.gold} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <Sparkles size={12} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Agent IA: Orchestration Livraisons
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
        </div>
        {open ? <ChevronUp size={16} color={T.textSec} /> : <ChevronDown size={16} color={T.textSec} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
            {kpis.map(k => (
              <div key={k.label} style={{
                background: `${T.cardBorder}40`, borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${T.cardBorder}`, textAlign: 'center',
              }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: T.gold }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Truck Table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      color: T.textDim, fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.15em',
                      borderBottom: `1px solid ${T.cardBorder}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trucks.map((t, i) => (
                  <tr key={i} style={{
                    borderBottom: i < trucks.length - 1 ? `1px solid ${T.cardBorder}60` : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: T.textPri }}>{t.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: `${t.statutColor}18`, color: t.statutColor,
                        border: `1px solid ${t.statutColor}30`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.statutColor }} />
                        {t.statut}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>{t.position}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textPri, fontWeight: 500 }}>{t.chargement}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>{t.eta}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: t.alerte ? T.danger : T.textDim, fontWeight: t.alerte ? 600 : 400 }}>
                      {t.alerte || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Recommendations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color={T.gold} />
            <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommandations IA</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.length === 0 ? (
              <div style={{
                borderLeft: '4px solid #64748B',
                background: 'rgba(100,116,139,0.08)',
                borderRadius: '0 10px 10px 0',
                padding: '12px 16px',
                border: '1px solid rgba(100,116,139,0.2)',
                borderLeftWidth: 4,
                borderLeftColor: '#64748B',
              }}>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: T.textSec }}>✅ Aucune anomalie détectée — toutes les livraisons sont dans les délais normaux.</p>
              </div>
            ) : (
              recommendations.map((r, i) => (
                <div key={i} style={{
                  borderLeft: `4px solid ${r.borderColor}`,
                  background: `${r.borderColor}08`,
                  borderRadius: '0 10px 10px 0',
                  padding: '12px 16px',
                  border: `1px solid ${r.borderColor}20`,
                  borderLeftWidth: 4,
                  borderLeftColor: r.borderColor,
                }}>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: T.textPri }}>{r.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
