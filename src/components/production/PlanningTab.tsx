import { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Factory, Truck, Plus, Upload, X,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isBefore, startOfDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold:       '#FFD700',
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
      { id: 'p1', bc: 'BC-2024-001', client: 'BTP Maroc', formule: 'F-B25', volume: 45, status: 'planned' },
      { id: 'p2', bc: 'BC-2024-002', client: 'Constructions Modernes', formule: 'F-B30', volume: 80, status: 'planned' },
    ]},
    { dayOffset: 1, chips: [
      { id: 'p3', bc: 'BC-2602-2611', client: 'BTP Maroc', formule: 'F-B25', volume: 20, status: 'planned' },
      { id: 'p4', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 30, status: 'planned' },
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

const FORMULE_COLORS: Record<string, { bg: string; color: string }> = {
  'F-B25': { bg: 'rgba(212,168,67,0.2)', color: '#D4A843' },
  'F-B30': { bg: 'rgba(59,130,246,0.2)', color: '#60A5FA' },
  'F-B35': { bg: 'rgba(168,85,247,0.2)', color: '#A855F7' },
  'F-B20': { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' },
  'F-B40': { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' },
  'Spécial': { bg: 'rgba(236,72,153,0.2)', color: '#EC4899' },
};

function chipStyle(status: PlanningChip['status']) {
  switch (status) {
    case 'completed': return { bg: 'rgba(16,185,129,0.10)', border: T.success };
    case 'production': return { bg: 'rgba(59,130,246,0.10)', border: T.info };
    case 'urgent': return { bg: 'rgba(212,168,67,0.10)', border: T.gold };
    default: return { bg: 'rgba(212,168,67,0.10)', border: T.gold };
  }
}

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
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0B1120', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: 480, padding: 0,
      }}>
        {/* Header */}
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

        {/* Form */}
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

        {/* Footer */}
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
            background: T.gold, border: 'none', color: '#000',
            fontSize: 13, fontWeight: 600,
          }}>Planifier</button>
        </div>
      </div>
    </div>
  );
}

export default function PlanningTab({ openModal }: { openModal?: boolean }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);

  // Allow parent to trigger modal open
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

  // Today's detail data for sidebar
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
            }}>
              <ChevronLeft size={16} style={{ color: T.textSec }} />
            </button>
            <button onClick={() => setWeekOffset(0)} style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              background: weekOffset === 0 ? `${T.gold}18` : 'transparent',
              border: `1px solid ${weekOffset === 0 ? T.gold + '50' : T.cardBorder}`,
              color: weekOffset === 0 ? T.gold : T.textSec, fontWeight: 600, fontSize: 13,
            }}>
              Aujourd'hui
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${T.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={16} style={{ color: T.textSec }} />
            </button>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
              {format(weekStart, 'dd MMM', { locale: fr })} — {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Week KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Livraisons Semaine', value: weekCount, icon: Truck },
          { label: 'Volume Semaine', value: `${weekVolume.toLocaleString('fr-FR')} m³`, icon: Factory },
          { label: 'Moyenne/Jour', value: `${avgDay} m³`, icon: Clock },
        ].map(k => (
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 10, padding: '14px 16px' }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{k.label}</span>
              <k.icon size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 400, color: '#fff', lineHeight: 1 }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar grid + detail */}
      <SectionHeader icon={Calendar} label="Calendrier Hebdomadaire" />
      <div className="flex gap-5">
        <div className="flex-1">
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              {weekDays.map(day => {
                const isSunday = day.getDay() === 0;
                return (
                  <div key={day.toISOString()} style={{
                    padding: '12px 8px', textAlign: 'center',
                    background: isSunday
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(75,85,99,0.1) 10px, rgba(75,85,99,0.1) 11px)'
                      : isToday(day) ? `${T.gold}0D` : isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent',
                    borderBottom: isToday(day) ? `2px solid ${T.gold}` : '2px solid transparent',
                  }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      {format(day, 'EEE', { locale: fr })}
                    </p>
                    <p style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 400,
                      color: isToday(day) ? T.gold : isBefore(day, startOfDay(new Date())) ? 'rgba(255,255,255,0.3)' : '#fff',
                      marginTop: 2,
                    }}>
                      {format(day, 'dd')}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7" style={{ minHeight: 280 }}>
              {weekDays.map((day, dayIdx) => {
                const dayChips = chipsByDayOffset[dayIdx] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPast = isBefore(day, startOfDay(new Date()));

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      padding: '10px 8px',
                      borderRight: `1px solid ${T.cardBorder}`,
                      cursor: 'pointer',
                      background: isSunday
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(75,85,99,0.1) 10px, rgba(75,85,99,0.1) 11px)'
                        : isToday(day)
                          ? 'linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 100%)'
                          : isSelected ? 'rgba(212,168,67,0.06)' : isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent',
                      opacity: isPast ? 0.4 : 1,
                      transition: 'background 150ms',
                      minHeight: 120,
                    }}
                    onMouseEnter={e => { if (!isSelected && !isSunday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isSelected && !isSunday) e.currentTarget.style.background = isToday(day) ? 'linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 100%)' : isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                  >
                    {isSunday ? (
                      <p style={{ fontSize: 13, color: '#4A5568', textAlign: 'center', paddingTop: 30, fontStyle: 'italic' }}>Fermé</p>
                    ) : dayChips.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {dayChips.map(chip => {
                          const cs = chipStyle(chip.status);
                          const fc = FORMULE_COLORS[chip.formule] || FORMULE_COLORS['F-B25'];
                          const bigOrder = chip.volume >= 50;
                          return (
                            <div key={chip.id} style={{
                              padding: '6px 8px', borderRadius: 6,
                              background: cs.bg, borderLeft: `2px solid ${cs.border}`,
                              borderTop: '2px solid #D4A843',
                              border: `1px solid ${bigOrder ? 'rgba(212,168,67,0.6)' : 'rgba(212,168,67,0.25)'}`,
                              borderLeftWidth: 2, borderLeftColor: cs.border,
                              borderTopWidth: 2, borderTopColor: '#D4A843',
                              overflow: 'hidden',
                              transition: 'all 200ms ease',
                              cursor: 'pointer',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = '#D4A843'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = bigOrder ? 'rgba(212,168,67,0.6)' : 'rgba(212,168,67,0.25)'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                                  background: fc.bg, color: fc.color, flexShrink: 0,
                                }}>{chip.formule.replace('F-', '')}</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {chip.bc ? chip.bc : chip.client}
                                </span>
                                {chip.status === 'urgent' && (
                                  <span style={{
                                    fontSize: 9, fontWeight: 700, color: T.danger,
                                    background: 'rgba(248,113,113,0.15)', padding: '4px 10px', borderRadius: 3,
                                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                                    boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                                    animation: 'urgent-pulse 2s infinite',
                                  }}>Urgent</span>
                                )}
                              </div>
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {chip.client} · {chip.volume}m³
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          border: '1px dashed rgba(212,168,67,0.2)', borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minHeight: 58, cursor: 'pointer', transition: 'all 200ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.4)'; e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ color: 'rgba(212,168,67,0.3)', fontSize: 18, lineHeight: 1 }}>+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 12, height: '100%', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.cardBorder}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
                {selectedDate ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr }) : 'Détail du jour'}
              </span>
              {selectedDate && isSelectedToday && (
                <p style={{ fontSize: 11, color: T.gold, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  3 livraisons · 105 m³
                </p>
              )}
              {selectedDate && !isSelectedToday && selectedDayChips.length > 0 && (
                <p style={{ fontSize: 11, color: T.gold, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  {selectedDayChips.length} livraison{selectedDayChips.length > 1 ? 's' : ''} · {selectedDayChips.reduce((s, c) => s + c.volume, 0)}m³
                </p>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="scrollbar-thin">
              {selectedDate ? (
                isSelectedToday ? (
                  <>
                    {todayDetailItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 16px', borderLeft: '3px solid #D4A843',
                          margin: '0 12px 6px', borderRadius: '0 8px 8px 0',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: '#fff' }}>
                            {item.formule}
                          </span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            {item.heure}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: T.gold }}>
                            {item.volume} m³
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: T.textSec }}>{item.client}</span>
                      </div>
                    ))}
                    <div style={{ padding: '12px 16px', marginTop: 8, borderTop: `1px solid ${T.cardBorder}` }}>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gold }}>
                        3 livraisons · 105 m³
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                        ⚡ Capacité restante: 95 m³
                      </p>
                    </div>
                  </>
                ) : selectedDayChips.length > 0 ? (
                  selectedDayChips.map(chip => {
                    const cs = chipStyle(chip.status);
                    return (
                      <div
                        key={chip.id}
                        style={{
                          padding: '12px 16px', borderLeft: `3px solid ${cs.border}`,
                          margin: '0 12px 6px', borderRadius: '0 8px 8px 0',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: '#fff' }}>
                            {chip.bc || chip.formule}
                          </span>
                          {chip.status === 'urgent' && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: T.danger, background: 'rgba(248,113,113,0.15)', padding: '1px 5px', borderRadius: 3 }}>URGENT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: T.gold }}>
                            {chip.volume} m³
                          </span>
                          <span style={{ fontSize: 10, color: T.textDim }}>· {chip.formule}</span>
                        </div>
                        <span style={{ fontSize: 10, color: T.textSec }}>{chip.client}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Calendar size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>Aucune livraison</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Pas de livraison planifiée ce jour</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Calendar size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 }}>Sélectionnez un jour</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gold }}>
                    {weekCount} livraisons · {weekVolume.toLocaleString('fr-FR')}m³ total
                  </p>
                </div>
              )}
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
        <div className="flex items-center gap-4" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
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
