import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Factory, Truck, Plus, Upload, X,
  Zap, TrendingUp, Package, MapPin, ArrowRight,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isBefore, startOfDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold:       '#D4A843',
  goldBright: '#FFD700',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  info:       '#3B82F6',
  danger:     '#f87171',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

interface PlanningChip {
  id: string;
  bc?: string;
  client: string;
  formule: string;
  volume: number;
  status: 'planned' | 'production' | 'completed' | 'urgent';
}

interface PlanningDay {
  dayOffset: number;
  chips: PlanningChip[];
}

function getDemoData(): PlanningDay[] {
  return [
    { dayOffset: 0, chips: [
      { id: 'p1', bc: 'BC-2024-001', client: 'BTP Maroc', formule: 'F-B25', volume: 45, status: 'completed' },
      { id: 'p2', bc: 'BC-2024-002', client: 'Constructions Modernes', formule: 'F-B30', volume: 80, status: 'completed' },
    ]},
    { dayOffset: 1, chips: [
      { id: 'p3', bc: 'BC-2602-2611', client: 'BTP Maroc', formule: 'F-B25', volume: 20, status: 'completed' },
      { id: 'p4', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 30, status: 'completed' },
    ]},
    { dayOffset: 2, chips: [
      { id: 'p5', bc: 'BC-2602-2373', client: 'Constructions Modernes', formule: 'F-B20', volume: 80, status: 'completed' },
      { id: 'p6', client: 'BTP Maroc', formule: 'F-B25', volume: 45, status: 'production' },
      { id: 'p7', client: 'Saudi Readymix', formule: 'F-B30', volume: 20, status: 'planned' },
    ]},
    { dayOffset: 3, chips: [
      { id: 'p8', client: 'Constructions Modernes', formule: 'F-B30', volume: 60, status: 'planned' },
      { id: 'p9', client: 'BTP Maroc', formule: 'F-B25', volume: 35, status: 'planned' },
      { id: 'p10', client: 'Ciments & Béton du Sud', formule: 'F-B20', volume: 30, status: 'urgent' },
    ]},
    { dayOffset: 4, chips: [
      { id: 'p11', client: 'Saudi Readymix', formule: 'F-B25', volume: 50, status: 'planned' },
      { id: 'p12', client: 'BTP Maroc', formule: 'F-B20', volume: 20, status: 'planned' },
    ]},
    { dayOffset: 5, chips: [
      { id: 'p13', client: 'BTP Maroc', formule: 'F-B25', volume: 35, status: 'planned' },
    ]},
  ];
}

const FORMULE_COLORS: Record<string, { bg: string; color: string; glow: string }> = {
  'F-B25': { bg: 'rgba(212,168,67,0.2)', color: '#D4A843', glow: 'rgba(212,168,67,0.15)' },
  'F-B30': { bg: 'rgba(59,130,246,0.2)', color: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
  'F-B35': { bg: 'rgba(168,85,247,0.2)', color: '#A855F7', glow: 'rgba(168,85,247,0.15)' },
  'F-B20': { bg: 'rgba(34,197,94,0.2)', color: '#22C55E', glow: 'rgba(34,197,94,0.15)' },
  'F-B40': { bg: 'rgba(239,68,68,0.2)', color: '#EF4444', glow: 'rgba(239,68,68,0.15)' },
  'Spécial': { bg: 'rgba(236,72,153,0.2)', color: '#EC4899', glow: 'rgba(236,72,153,0.15)' },
};

const STATUS_ICONS: Record<string, { color: string; label: string }> = {
  completed: { color: '#34d399', label: 'Livré' },
  production: { color: '#60A5FA', label: 'En cours' },
  planned: { color: '#D4A843', label: 'Planifié' },
  urgent: { color: '#f87171', label: 'Urgent' },
};

const DAILY_CAPACITY = 200; // m³

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Icon size={16} strokeWidth={1.5} style={{ color: T.gold, flexShrink: 0 }} />
      <span style={{
        color: T.gold, fontWeight: 600, fontSize: 13,
        textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.gold}4D 0%, transparent 80%)` }} />
    </div>
  );
}

/* ── DeliveryCard — a single chip in the calendar ── */
function DeliveryCard({ chip, index }: { chip: PlanningChip; index: number }) {
  const fc = FORMULE_COLORS[chip.formule] || FORMULE_COLORS['F-B25'];
  const st = STATUS_ICONS[chip.status] || STATUS_ICONS.planned;
  const bigOrder = chip.volume >= 50;

  return (
    <div
      className="planning-card-enter"
      style={{
        padding: '8px 10px', borderRadius: 8,
        background: `linear-gradient(135deg, ${fc.glow} 0%, rgba(15,22,41,0.6) 100%)`,
        border: `1px solid ${bigOrder ? fc.color + '60' : fc.color + '30'}`,
        overflow: 'hidden',
        transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        position: 'relative',
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${fc.color}25, 0 0 0 1px ${fc.color}50`;
        e.currentTarget.style.borderColor = fc.color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = bigOrder ? fc.color + '60' : fc.color + '30';
      }}
    >
      {/* Status dot — top-right breathing indicator */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        width: 6, height: 6, borderRadius: '50%',
        background: st.color,
        boxShadow: `0 0 6px ${st.color}80`,
        animation: chip.status === 'production' ? 'status-breathe 2s ease-in-out infinite' : chip.status === 'urgent' ? 'urgent-glow 1.5s ease-in-out infinite' : 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: fc.bg, color: fc.color, flexShrink: 0,
          border: `1px solid ${fc.color}30`,
          letterSpacing: '0.02em',
        }}>{chip.formule.replace('F-', '')}</span>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.55)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          fontWeight: 500,
        }}>
          {chip.bc || chip.client}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)',
          fontWeight: 400,
        }}>
          {chip.client.length > 18 ? chip.client.slice(0, 18) + '…' : chip.client}
        </span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600,
          color: fc.color, letterSpacing: '-0.02em',
        }}>
          {chip.volume}m³
        </span>
      </div>

      {chip.status === 'urgent' && (
        <div style={{
          marginTop: 4, fontSize: 9, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          padding: '2px 8px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          display: 'inline-block',
          boxShadow: '0 0 10px rgba(239,68,68,0.4)',
          animation: 'urgent-glow 1.5s ease-in-out infinite',
        }}>⚡ Urgent</div>
      )}

      {/* Volume bar — micro utilization indicator */}
      <div style={{
        marginTop: 5, height: 2, borderRadius: 1,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 1,
          width: `${Math.min(100, (chip.volume / DAILY_CAPACITY) * 100 * 3)}%`,
          background: `linear-gradient(90deg, ${fc.color}80, ${fc.color})`,
          transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

/* ── Capacity Bar — daily utilization gauge at column bottom ── */
function CapacityBar({ chips }: { chips: PlanningChip[] }) {
  const totalVolume = chips.reduce((s, c) => s + c.volume, 0);
  const pct = Math.min(100, (totalVolume / DAILY_CAPACITY) * 100);
  const isHigh = pct > 70;
  const isCritical = pct > 90;
  const barColor = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : T.gold;

  return (
    <div style={{ marginTop: 'auto', padding: '8px 0 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Capacité
        </span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 9, fontWeight: 600,
          color: barColor, letterSpacing: '-0.02em',
        }}>
          {totalVolume}/{DAILY_CAPACITY}m³
        </span>
      </div>
      <div style={{
        height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}90, ${barColor})`,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isHigh ? `0 0 8px ${barColor}40` : 'none',
        }} />
      </div>
    </div>
  );
}

/* ── Modal ── */
function PlanningModal({ onClose }: { onClose: () => void }) {
  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.50)', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
    outline: 'none', appearance: 'none' as const, cursor: 'pointer',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginBottom: 6, display: 'block',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0B1120', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: 480, padding: 0,
        animation: 'modal-enter 300ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="flex items-center gap-3">
            <Calendar size={18} strokeWidth={1.5} style={{ color: T.gold }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Nouvelle Planification</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Bon de Commande</label>
            <select style={selectStyle} defaultValue="">
              <option value="" disabled>Sélectionner un BC</option>
              <option>BC-2024-001</option>
              <option>BC-2024-002</option>
              <option>BC-2602-2611</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date de production</label>
            <input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} style={{
              ...selectStyle, color: 'rgba(255,255,255,0.70)',
            }} />
          </div>
          <div>
            <label style={labelStyle}>Heure de début</label>
            <select style={selectStyle} defaultValue="">
              <option value="" disabled>Sélectionner l'heure</option>
              <option>06:00</option><option>07:00</option><option>08:00</option>
              <option>09:00</option><option>10:00</option><option>11:00</option>
              <option>12:00</option><option>13:00</option><option>14:00</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priorité</label>
            <select style={selectStyle} defaultValue="normale">
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div style={{
          padding: '16px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
          }}>Annuler</button>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
            background: `linear-gradient(135deg, ${T.gold}, #B8922E)`,
            border: 'none', color: '#0F1629',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 12px rgba(212,168,67,0.3)',
          }}>Planifier</button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Sidebar Item ── */
function DetailItem({ item, index }: { item: { id: string; formule: string; client: string; volume: number; heure: string }; index: number }) {
  const fc = FORMULE_COLORS[item.formule] || FORMULE_COLORS['F-B25'];
  return (
    <div
      className="detail-item-enter"
      style={{
        padding: '14px 16px',
        margin: '0 12px 8px', borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${fc.color}`,
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
        animationDelay: `${index * 80}ms`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = `${fc.color}60`;
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = `0 4px 16px ${fc.color}15`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderLeftColor = fc.color;
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Subtle glow at left edge */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
        background: `linear-gradient(90deg, ${fc.color}08, transparent)`,
        pointerEvents: 'none',
      }} />

      <div className="flex items-center justify-between mb-2" style={{ position: 'relative' }}>
        <div className="flex items-center gap-2">
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 600,
            color: fc.color, letterSpacing: '-0.02em',
          }}>
            {item.formule}
          </span>
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: `${fc.color}15`, color: fc.color,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {item.formule.replace('F-', '')}
          </span>
        </div>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 4,
        }}>
          {item.heure}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 200,
          color: '#fff', letterSpacing: '-0.03em',
        }}>
          {item.volume} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>m³</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <MapPin size={10} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: 11, color: T.textSec }}>{item.client}</span>
      </div>

      {/* Volume proportion bar */}
      <div style={{ marginTop: 8, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          height: '100%', borderRadius: 1,
          width: `${Math.min(100, (item.volume / DAILY_CAPACITY) * 100 * 4)}%`,
          background: `linear-gradient(90deg, ${fc.color}60, ${fc.color})`,
        }} />
      </div>
    </div>
  );
}

export default function PlanningTab({ openModal }: { openModal?: boolean }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    if (openModal) setShowModal(true);
  }, [openModal]);

  const baseDate = useMemo(() => addDays(new Date(), weekOffset * 7), [weekOffset]);
  const weekStart = useMemo(() => startOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekEnd = useMemo(() => endOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const demoData = useMemo(() => getDemoData(), []);
  const chipsByDayOffset = useMemo(() => {
    const map: Record<number, PlanningChip[]> = {};
    demoData.forEach(d => { map[d.dayOffset] = d.chips; });
    return map;
  }, [demoData]);

  const todayDetailItems = [
    { id: 'td1', formule: 'F-B25', client: 'Saudi Readymix', volume: 50, heure: '08:00' },
    { id: 'td2', formule: 'F-B25', client: 'BTP Maroc', volume: 35, heure: '10:30' },
    { id: 'td3', formule: 'F-B20', client: 'BTP Maroc', volume: 20, heure: '14:00' },
  ];

  const selectedDayChips = useMemo(() => {
    if (!selectedDate) return [];
    const dayIdx = weekDays.findIndex(d => isSameDay(d, selectedDate));
    return chipsByDayOffset[dayIdx] || [];
  }, [selectedDate, weekDays, chipsByDayOffset]);

  const isSelectedToday = selectedDate && isToday(selectedDate);

  const weekCount = 18;
  const weekVolume = 1240;
  const avgDay = 207;

  return (
    <div className="flex flex-col gap-6">
      <style>{`
        @keyframes urgent-glow {
          0%, 100% { box-shadow: 0 0 4px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 12px rgba(239,68,68,0.5); }
        }
        @keyframes status-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes planning-card-enter {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes detail-item-enter {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes column-selected-glow {
          0%, 100% { box-shadow: inset 0 0 20px rgba(212,168,67,0.03); }
          50% { box-shadow: inset 0 0 30px rgba(212,168,67,0.06); }
        }
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes capacity-fill {
          from { width: 0%; }
        }
        @keyframes sidebar-pulse {
          0%, 100% { border-color: rgba(212,168,67,0.15); }
          50% { border-color: rgba(212,168,67,0.25); }
        }
        .planning-card-enter { animation: planning-card-enter 400ms cubic-bezier(0.4,0,0.2,1) both; }
        .detail-item-enter { animation: detail-item-enter 350ms cubic-bezier(0.4,0,0.2,1) both; }
        .day-column { transition: all 250ms cubic-bezier(0.4,0,0.2,1); }
        .day-column:hover { background: rgba(255,255,255,0.015) !important; }
        .empty-slot-plus { transition: all 250ms cubic-bezier(0.4,0,0.2,1); }
        .empty-slot-plus:hover { 
          border-color: rgba(212,168,67,0.5) !important; 
          background: rgba(212,168,67,0.06) !important;
          transform: scale(1.02);
        }
        .empty-slot-plus:hover .plus-icon { 
          color: rgba(212,168,67,0.8) !important; 
          transform: rotate(90deg);
        }
        .plus-icon { transition: all 300ms cubic-bezier(0.4,0,0.2,1); }
      `}</style>
      {showModal && <PlanningModal onClose={() => setShowModal(false)} />}

      {/* Header + Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 4 }}>Planning de Production</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Vue hebdomadaire des livraisons planifiées</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setWeekOffset(w => w - 1)} style={{
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${T.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 200ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + '50'; e.currentTarget.style.background = T.gold + '08'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronLeft size={16} style={{ color: T.textSec }} />
            </button>
            <button onClick={() => setWeekOffset(0)} style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'transparent',
              border: '1px solid #D4A843',
              color: '#D4A843', fontWeight: 600, fontSize: 13,
              transition: 'all 200ms',
            }}>
              Aujourd'hui
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${T.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 200ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + '50'; e.currentTarget.style.background = T.gold + '08'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronRight size={16} style={{ color: T.textSec }} />
            </button>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
              {format(weekStart, 'dd MMM', { locale: fr })} — {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Week KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Livraisons Semaine', value: weekCount, suffix: '', icon: Truck, accent: T.gold },
          { label: 'Volume Semaine', value: weekVolume.toLocaleString('fr-FR'), suffix: ' m³', icon: Package, accent: '#60A5FA' },
          { label: 'Moyenne/Jour', value: avgDay, suffix: ' m³', icon: TrendingUp, accent: '#34d399' },
        ].map(k => (
          <div key={k.label} style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderTop: `2px solid ${T.gold}`, borderRadius: 10, padding: '14px 16px',
            transition: 'all 250ms',
            position: 'relative', overflow: 'hidden',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.borderTopColor = T.gold; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{k.label}</span>
              <k.icon size={14} strokeWidth={1.5} style={{ color: k.accent + '40' }} />
            </div>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 36, fontWeight: 200, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {k.value}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>{k.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Calendar grid + detail */}
      <SectionHeader icon={Calendar} label="Calendrier Hebdomadaire" />
      <div className="flex gap-5">
        <div className="flex-1">
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            {/* Day headers */}
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              {weekDays.map((day, idx) => {
                const isSunday = day.getDay() === 0;
                const isT = isToday(day);
                const dayChips = chipsByDayOffset[idx] || [];
                const totalVol = dayChips.reduce((s, c) => s + c.volume, 0);

                return (
                  <div key={day.toISOString()} style={{
                    padding: '14px 8px 10px', textAlign: 'center',
                    background: isSunday
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(75,85,99,0.08) 10px, rgba(75,85,99,0.08) 11px)'
                      : isT ? 'rgba(212,168,67,0.08)' : 'transparent',
                    borderBottom: isT ? `2px solid ${T.gold}` : '2px solid transparent',
                    position: 'relative',
                    transition: 'all 200ms',
                  }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: isT ? T.gold + 'CC' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      {format(day, 'EEE', { locale: fr })}.
                    </p>
                    <p style={{
                      fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: isT ? 600 : 300,
                      color: isT ? T.gold : isBefore(day, startOfDay(new Date())) ? 'rgba(255,255,255,0.25)' : '#fff',
                      marginTop: 2, letterSpacing: '-0.02em',
                    }}>
                      {format(day, 'dd')}
                    </p>
                    {!isSunday && totalVol > 0 && (
                      <p style={{
                        fontFamily: 'ui-monospace, monospace', fontSize: 9, color: T.gold + '80',
                        marginTop: 3, fontWeight: 500,
                      }}>
                        {totalVol}m³
                      </p>
                    )}
                    {isT && (
                      <div style={{
                        position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                        width: 6, height: 6, borderRadius: '50%', background: T.gold,
                        boxShadow: `0 0 8px ${T.gold}60`,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7" style={{ minHeight: 320 }}>
              {weekDays.map((day, dayIdx) => {
                const dayChips = chipsByDayOffset[dayIdx] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSunday = day.getDay() === 0;
                const isT = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className="day-column"
                    onClick={() => !isSunday && setSelectedDate(day)}
                    onMouseEnter={() => setHoveredDay(dayIdx)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      padding: '10px 8px',
                      borderRight: dayIdx < 6 ? `1px solid rgba(30,45,74,0.6)` : 'none',
                      cursor: isSunday ? 'default' : 'pointer',
                      background: isSunday
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(75,85,99,0.06) 10px, rgba(75,85,99,0.06) 11px)'
                        : isSelected
                          ? 'linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.02) 100%)'
                          : isT
                            ? 'linear-gradient(180deg, rgba(212,168,67,0.05) 0%, transparent 100%)'
                            : 'transparent',
                      opacity: isPast && !isT ? 0.85 : 1,
                      minHeight: 320,
                      display: 'flex', flexDirection: 'column',
                      position: 'relative',
                      transition: 'background 200ms',
                    }}
                  >
                    {/* Selected column indicator */}
                    {isSelected && !isSunday && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        border: `1px solid ${T.gold}20`,
                        borderRadius: 0,
                        pointerEvents: 'none',
                        animation: 'column-selected-glow 3s ease-in-out infinite',
                      }} />
                    )}

                    {isSunday ? (
                      <div className="flex flex-col items-center justify-center flex-1 gap-2">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <X size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.15)' }} />
                        </div>
                        <p style={{ fontSize: 12, color: '#4A5568', fontStyle: 'italic', fontWeight: 500 }}>Fermé</p>
                      </div>
                    ) : dayChips.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                          {dayChips.map((chip, i) => (
                            <DeliveryCard key={chip.id} chip={chip} index={i} />
                          ))}
                        </div>
                        <CapacityBar chips={dayChips} />
                      </>
                    ) : (
                      <>
                        <div
                          className="empty-slot-plus"
                          style={{
                            border: '1px dashed rgba(212,168,67,0.2)', borderRadius: 8,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: 80, cursor: 'pointer',
                            gap: 6,
                          }}
                          onClick={e => { e.stopPropagation(); setShowModal(true); }}
                        >
                          <div className="plus-icon" style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(212,168,67,0.08)', border: '1px dashed rgba(212,168,67,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Plus size={14} style={{ color: 'rgba(212,168,67,0.4)' }} />
                          </div>
                          <span style={{ fontSize: 9, color: 'rgba(212,168,67,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                            Planifier
                          </span>
                        </div>
                        <div style={{ flex: 1 }} />
                        <CapacityBar chips={[]} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Detail Sidebar ── */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            animation: 'sidebar-pulse 4s ease-in-out infinite',
            overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '18px 18px 14px',
              borderBottom: `1px solid ${T.cardBorder}`,
              background: 'linear-gradient(180deg, rgba(212,168,67,0.04) 0%, transparent 100%)',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} strokeWidth={1.5} style={{ color: T.gold + '80' }} />
                <span style={{
                  fontSize: 14, fontWeight: 600, color: '#fff', textTransform: 'capitalize',
                }}>
                  {selectedDate ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr }) : 'Détail du jour'}
                </span>
              </div>
              {selectedDate && isSelectedToday && (
                <div className="flex items-center gap-2 mt-2">
                  <span style={{
                    fontFamily: 'ui-monospace, monospace', fontSize: 11, color: T.gold, fontWeight: 500,
                    background: T.gold + '12', padding: '3px 10px', borderRadius: 6,
                    border: `1px solid ${T.gold}25`,
                  }}>
                    3 livraisons · 105 m³
                  </span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#34d399',
                    animation: 'status-breathe 2s ease-in-out infinite',
                  }} />
                </div>
              )}
              {selectedDate && !isSelectedToday && selectedDayChips.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span style={{
                    fontFamily: 'ui-monospace, monospace', fontSize: 11, color: T.gold, fontWeight: 500,
                    background: T.gold + '12', padding: '3px 10px', borderRadius: 6,
                    border: `1px solid ${T.gold}25`,
                  }}>
                    {selectedDayChips.length} livraison{selectedDayChips.length > 1 ? 's' : ''} · {selectedDayChips.reduce((s, c) => s + c.volume, 0)}m³
                  </span>
                </div>
              )}
            </div>

            {/* Sidebar content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="scrollbar-thin">
              {selectedDate ? (
                isSelectedToday ? (
                  <>
                    {todayDetailItems.map((item, i) => (
                      <DetailItem key={item.id} item={item} index={i} />
                    ))}
                    <div style={{
                      padding: '14px 16px', margin: '8px 12px 0',
                      borderTop: `1px solid ${T.cardBorder}`,
                      background: 'rgba(212,168,67,0.03)', borderRadius: '0 0 8px 8px',
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: T.gold, fontWeight: 500 }}>
                          3 livraisons · 105 m³
                        </span>
                        <span style={{
                          fontSize: 9, padding: '2px 8px', borderRadius: 4,
                          background: '#34d399' + '15', color: '#34d399', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>52%</span>
                      </div>
                      {/* Capacity gauge */}
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{
                          height: '100%', borderRadius: 2, width: '52.5%',
                          background: `linear-gradient(90deg, ${T.gold}80, ${T.gold})`,
                          animation: 'capacity-fill 1s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Zap size={10} strokeWidth={2} style={{ color: T.gold }} />
                        Capacité restante: 95 m³
                      </p>
                    </div>
                  </>
                ) : selectedDayChips.length > 0 ? (
                  <>
                    {selectedDayChips.map((chip, i) => {
                      const fc = FORMULE_COLORS[chip.formule] || FORMULE_COLORS['F-B25'];
                      return (
                        <DetailItem
                          key={chip.id}
                          item={{
                            id: chip.id,
                            formule: chip.formule,
                            client: chip.client,
                            volume: chip.volume,
                            heure: ['08:00', '10:30', '14:00', '16:00'][i] || '08:00',
                          }}
                          index={i}
                        />
                      );
                    })}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={28} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div className="text-center">
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Aucune livraison</p>
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Pas de livraison planifiée ce jour</p>
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                        background: 'transparent', border: `1px solid ${T.gold}30`,
                        color: T.gold, fontSize: 12, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 200ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.gold + '10'; e.currentTarget.style.borderColor = T.gold + '50'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.gold + '30'; }}
                    >
                      <Plus size={12} /> Planifier une livraison
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Calendar size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 }}>Sélectionnez un jour</p>
                  <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: T.gold }}>
                    {weekCount} livraisons · {weekVolume.toLocaleString('fr-FR')}m³ total
                  </p>
                </div>
              )}
            </div>

            {/* Legend strip */}
            <div style={{
              padding: '10px 16px', borderTop: `1px solid ${T.cardBorder}`,
              display: 'flex', flexWrap: 'wrap', gap: 8,
            }}>
              {Object.entries(STATUS_ICONS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: val.color }} />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AGENT IA: COORDINATION LIVRAISONS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: '#D4A843', fontSize: 14, animation: 'pulse 3s ease-in-out infinite' }}>✦</span>
            <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AGENT IA: COORDINATION LIVRAISONS</span>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>Généré par IA · Claude Opus</span>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
          border: `1px solid ${T.cardBorder}`,
          borderTop: '2px solid #D4A843',
          borderLeft: '3px solid #D4A843',
          borderRadius: 12, padding: 20,
        }}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 1.7 }}>
                Capacité optimale demain (<span style={{ color: '#fff', fontWeight: 600 }}>Samedi 14</span>). 2 livraisons planifiées sur capacité de 200 m³. Aucun conflit détecté.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 1.7 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Lundi 09 Mars</span>: 2 livraisons simultanées à 08:00 (BTP Maroc + Constructions Modernes). Recommandation: décaler Constructions Modernes à <span style={{ color: '#D4A843', fontWeight: 600 }}>09:00</span> pour éviter congestion chargement.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 1.7 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Mercredi 11 Mars</span>: Livraison BC-2602-2373 F-B20 · 80m³ pour Constructions Modernes représente <span style={{ color: '#EF4444', fontWeight: 600 }}>40% de la capacité journalière</span>. Pré-positionner stocks gravette et sable la veille.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>3 recommandations</span>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>Confiance: 87%</span>
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`,
        borderRadius: 10, padding: '10px 20px',
      }}>
        <div className="flex items-center gap-4" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          <span><span style={{ color: '#fff', fontWeight: 400 }}>{weekCount}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> livraisons</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span><span style={{ color: '#fff', fontWeight: 400 }}>{weekVolume.toLocaleString('fr-FR')}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> m³</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Semaine du <span style={{ color: T.gold }}>{format(weekStart, 'dd MMM', { locale: fr })}</span></span>
        </div>
      </div>
    </div>
  );
}
