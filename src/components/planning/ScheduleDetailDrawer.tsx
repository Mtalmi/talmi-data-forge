import React from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Phone, Edit, Truck, Clock } from 'lucide-react';

const T = {
  gold: '#D4A843',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
  cardBorder: '#1E2D4A',
  success: '#10B981',
};

// Demo data generator based on slot info
function generateDemoData(slot: { product: string; volume: number; client: string }, dayLabel: string, timeLabel: string) {
  const clientDetails: Record<string, { chantier: string; km: number; min: number; prix: number; toupie: string; chauffeur: string; marge: number; status: string; bl: string; ia: string }> = {
    'Ciments du Maroc': { chantier: 'Site Ain Sebaa, Casablanca', km: 10, min: 22, prix: 850, toupie: 'TOU-01', chauffeur: 'Hassan Amrani', marge: 36, status: 'Planifié', bl: 'BL-2024-001', ia: 'Créneau optimal confirmé. Trafic faible avant 7h. Aucun conflit détecté.' },
    'ONCF': { chantier: 'Gare LGV, Kénitra', km: 12, min: 25, prix: 920, toupie: 'TOU-02', chauffeur: 'Youssef Bakkali', marge: 32, status: 'Planifié', bl: 'BL-2024-002', ia: 'Route optimale via autoroute. Temps de déchargement estimé 35 min.' },
    'Addoha': { chantier: 'Résidence Al Firdaous, Marrakech', km: 18, min: 35, prix: 800, toupie: 'TOU-01', chauffeur: 'Hassan Amrani', marge: 28, status: 'Planifié', bl: 'BL-2024-003', ia: 'Client régulier — historique ponctuel. Prévoir accès chantier restreint.' },
    'Tgcc': { chantier: 'Tour CFC, Casablanca Finance City', km: 28, min: 45, prix: 950, toupie: 'TOU-03', chauffeur: 'Omar Tahiri', marge: 34, status: 'Planifié', bl: 'BL-2024-004', ia: 'Zone urbaine dense. Recommandation: livraison avant 8h pour éviter embouteillages.' },
    'Alliances': { chantier: 'Eco-Quartier Zenata', km: 14, min: 28, prix: 870, toupie: 'TOU-02', chauffeur: 'Youssef Bakkali', marge: 31, status: 'Planifié', bl: 'BL-2024-005', ia: 'Capacité pompe confirmée. Coordination avec grutier en place.' },
    'Jet Con.': { chantier: 'Marina Bouregreg, Rabat', km: 20, min: 38, prix: 980, toupie: 'TOU-03', chauffeur: 'Omar Tahiri', marge: 38, status: 'Planifié', bl: 'BL-2024-006', ia: 'Formule spéciale B40 — contrôle qualité renforcé recommandé.' },
    'Palmeraie': { chantier: 'Palmeraie Village, Bouskoura', km: 16, min: 30, prix: 830, toupie: 'TOU-01', chauffeur: 'Hassan Amrani', marge: 29, status: 'Planifié', bl: 'BL-2024-007', ia: 'Accès large — pas de contrainte. Client fidèle depuis 2 ans.' },
    'Ciments': { chantier: 'Usine Settat, Route Nationale', km: 22, min: 40, prix: 840, toupie: 'TOU-02', chauffeur: 'Youssef Bakkali', marge: 30, status: 'Planifié', bl: 'BL-2024-008', ia: 'Volume important. Prévoir 2 rotations pour compléter la commande.' },
    'Jet': { chantier: 'Projet Anfa Place', km: 15, min: 28, prix: 960, toupie: 'TOU-03', chauffeur: 'Omar Tahiri', marge: 35, status: 'Planifié', bl: 'BL-2024-009', ia: 'Formule spéciale validée par le labo. Affaissement cible: 18cm.' },
    'Divers': { chantier: 'Chantier particulier, Casablanca', km: 8, min: 18, prix: 780, toupie: 'TOU-01', chauffeur: 'Hassan Amrani', marge: 25, status: 'Planifié', bl: 'BL-2024-010', ia: 'Petit volume — possibilité de regrouper avec livraison suivante.' },
  };

  const fallback = { chantier: 'Chantier Casablanca', km: 15, min: 30, prix: 850, toupie: 'TOU-01', chauffeur: 'Hassan Amrani', marge: 30, status: 'Planifié', bl: 'BL-2024-011', ia: 'Créneau validé. Aucune alerte détectée.' };
  const d = clientDetails[slot.client] || fallback;
  const montant = slot.volume * d.prix;

  const formuleMap: Record<string, string> = {
    'B25': 'F-B25 Standard', 'B30': 'F-B30 Structural', 'B35': 'F-B35 Haute Résistance',
    'B40': 'F-B40 Premium', 'Spécial': 'F-SPE Formule Spéciale',
  };

  return {
    bl: d.bl,
    client: slot.client,
    status: d.status,
    formule: formuleMap[slot.product] || `F-${slot.product}`,
    volume: `${slot.volume} m³`,
    chantier: d.chantier,
    heure: `${dayLabel} 09 Mars · ${timeLabel}`,
    toupie: `${d.toupie} · ${d.chauffeur}`,
    distance: `${d.km} km · ~${d.min} min`,
    prixUnitaire: `${d.prix.toLocaleString('fr-FR')} DH/m³`,
    montant: `${montant.toLocaleString('fr-FR')} DH`,
    marge: `${d.marge}%`,
    ia: d.ia,
  };
}

export interface ScheduleSlotInfo {
  slot: { product: string; volume: number; client: string };
  dayLabel: string;
  timeLabel: string;
}

interface Props {
  info: ScheduleSlotInfo | null;
  onClose: () => void;
}

export function ScheduleDetailDrawer({ info, onClose }: Props) {
  if (!info) return null;
  const data = generateDemoData(info.slot, info.dayLabel, info.timeLabel);

  const details: Array<{ label: string; value: string }> = [
    { label: 'Formule', value: data.formule },
    { label: 'Volume', value: data.volume },
    { label: 'Client', value: data.client },
    { label: 'Chantier', value: data.chantier },
    { label: 'Heure prévue', value: data.heure },
    { label: 'Toupie assignée', value: data.toupie },
    { label: 'Distance', value: data.distance },
    { label: 'Prix unitaire', value: data.prixUnitaire },
    { label: 'Montant', value: data.montant },
    { label: 'Marge estimée', value: data.marge },
  ];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9998, backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: '#0F1629', borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderTop: '2px solid #D4A843',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 250ms ease-out',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderLeft: '4px solid #D4A843', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.textPri }}>
              {data.bl} · {data.client}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.gold }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>{data.status}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color={T.textSec} />
          </button>
        </div>

        {/* Details */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {details.map((d, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
              }}>
                <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>{d.label}</span>
                <span style={{
                  fontSize: 12, color: T.textPri, fontWeight: 600,
                  fontFamily: ['Volume', 'Montant', 'Prix unitaire', 'Marge estimée', 'Distance'].includes(d.label) ? 'JetBrains Mono, monospace' : 'DM Sans, sans-serif',
                }}>{d.value}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #D4A843', color: '#D4A843',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <Edit size={13} />
              Modifier Planification
            </button>
            <button style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #D4A843', color: '#D4A843',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <Phone size={13} />
              Contacter Client
            </button>
          </div>

          {/* AI Recommendation */}
          <div style={{
            marginTop: 24,
            background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
            borderLeft: '3px solid #D4A843',
            borderRadius: 8, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ color: '#D4A843', fontSize: 13, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
              <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em' }}>AGENT IA</span>
              <span style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: 999, fontSize: 8, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>Généré par IA · Claude Opus</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              ✦ IA: {data.ia}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}
