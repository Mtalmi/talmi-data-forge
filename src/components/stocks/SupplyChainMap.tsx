import React, { useState } from 'react';
import { Factory, Truck } from 'lucide-react';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

interface Supplier {
  id: string;
  name: string;
  materials: { label: string; color: string }[];
  lastDelivery: string;
  nextDelivery: string;
  nextUrgent: boolean;
  price: string;
  urgent: boolean;
  deliveryDelay: string;
}

const SUPPLIERS: Supplier[] = [
  {
    id: 'lafarge',
    name: 'LafargeHolcim',
    materials: [{ label: 'Ciment', color: '#D4A843' }],
    lastDelivery: '10/03',
    nextDelivery: '18/03',
    nextUrgent: false,
    price: '450 DH/t',
    urgent: false,
    deliveryDelay: '2-3 jours',
  },
  {
    id: 'carrieres',
    name: 'Carrières du Sud',
    materials: [
      { label: 'Sable', color: '#D4A843' },
      { label: 'Gravette', color: '#D4A843' },
    ],
    lastDelivery: '08/03',
    nextDelivery: '16/03',
    nextUrgent: false,
    price: '120 DH/m³',
    urgent: false,
    deliveryDelay: '1-2 jours',
  },
  {
    id: 'sika',
    name: 'Sika Maroc',
    materials: [{ label: 'Adjuvant', color: '#EF4444' }],
    lastDelivery: '01/03',
    nextDelivery: 'EN ATTENTE',
    nextUrgent: true,
    price: '85 DH/L',
    urgent: true,
    deliveryDelay: '3-5 jours',
  },
];

export function SupplyChainMap() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const svgW = 220;
  const supplierX = 0;
  const plantX = svgW;
  const supplierYs = [50, 150, 250];
  const plantY = 150;

  return (
    <div>
      <style>{`
        @keyframes flowDash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes flowDashRed {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pendingPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ CHAÎNE D'APPROVISIONNEMENT
        </span>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12, padding: 24,
        display: 'grid',
        gridTemplateColumns: '1fr 220px 1fr',
        alignItems: 'center',
        gap: 0,
        minHeight: 320,
      }}>
        {/* LEFT: Supplier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SUPPLIERS.map((s) => (
            <div
              key={s.id}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                border: '1px solid rgba(212,168,67,0.3)',
                borderLeft: s.urgent ? '3px solid #EF4444' : '1px solid rgba(212,168,67,0.3)',
                borderRadius: 10,
                padding: 12,
                background: hoveredId === s.id ? 'rgba(212,168,67,0.06)' : 'rgba(255,255,255,0.02)',
                transition: 'all 200ms',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Truck size={14} color={s.urgent ? '#EF4444' : '#D4A843'} />
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {s.materials.map((m) => (
                  <span key={m.label} style={{
                    fontFamily: MONO, fontSize: 10, padding: '2px 8px', borderRadius: 999,
                    background: m.color === '#EF4444' ? 'rgba(239,68,68,0.12)' : 'rgba(212,168,67,0.12)',
                    color: m.color, border: `1px solid ${m.color}40`,
                  }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>
                  Dernier: {s.lastDelivery}
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: 11,
                  color: s.nextUrgent ? '#EF4444' : '#D4A843',
                  fontWeight: s.nextUrgent ? 600 : 400,
                  animation: s.nextUrgent ? 'pendingPulse 2s infinite' : 'none',
                }}>
                  Prochain: {s.nextDelivery}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>
                  Prix: {s.price}
                </span>
              </div>

              {/* Tooltip on hover */}
              {hoveredId === s.id && (
                <div style={{
                  position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(15,22,41,0.95)', border: '1px solid rgba(212,168,67,0.3)',
                  borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap', zIndex: 10,
                  fontFamily: MONO, fontSize: 10, color: '#D4A843',
                }}>
                  Délai livraison: {s.deliveryDelay}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CENTER: SVG connecting lines */}
        <svg width={svgW} height={300} style={{ overflow: 'visible' }}>
          {SUPPLIERS.map((s, i) => {
            const sy = supplierYs[i];
            const isActive = hoveredId === s.id;
            const lineColor = s.urgent ? '#EF4444' : '#D4A843';
            const opacity = hoveredId === null ? 0.5 : isActive ? 1 : 0.15;
            const cpx1 = svgW * 0.4;
            const cpx2 = svgW * 0.6;

            return (
              <path
                key={s.id}
                d={`M 0 ${sy} C ${cpx1} ${sy}, ${cpx2} ${plantY}, ${plantX} ${plantY}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray="8 4"
                strokeLinecap="round"
                opacity={opacity}
                style={{
                  animation: s.urgent
                    ? 'flowDashRed 1.5s linear infinite'
                    : 'flowDash 3s linear infinite',
                  transition: 'opacity 300ms, stroke-width 300ms',
                }}
              />
            );
          })}
        </svg>

        {/* RIGHT: Plant card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            border: '2px solid rgba(212,168,67,0.4)',
            borderRadius: 14, padding: '24px 20px',
            background: 'rgba(212,168,67,0.04)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            minWidth: 200,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #D4A843, #B8860B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Factory size={22} color="#0B1120" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'center' }}>
              Atlas Concrete Morocco
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843', textAlign: 'center' }}>
              5 matériaux · 2.4M DH stock
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
