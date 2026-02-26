import { useState, useMemo } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Factory, Truck, Plus, Upload,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isBefore, startOfDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold:       '#D4A843',
  cardBg:     'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
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
  dayOffset: number; // offset from week start (Mon=0)
  chips: PlanningChip[];
}

// Demo data seeded relative to current week
function getDemoData(): PlanningDay[] {
  return [
    { dayOffset: 0, chips: [ // Lundi
      { id: 'p1', bc: 'BC-2024-001', client: 'BTP Maroc', formule: 'F-B25', volume: 45, status: 'planned' },
      { id: 'p2', bc: 'BC-2024-002', client: 'Constructions Modernes', formule: 'F-B30', volume: 80, status: 'planned' },
    ]},
    { dayOffset: 1, chips: [ // Mardi
      { id: 'p3', bc: 'BC-2602-2611', client: 'BTP Maroc', formule: 'F-B25', volume: 20, status: 'planned' },
      { id: 'p4', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 30, status: 'planned' },
    ]},
    { dayOffset: 2, chips: [ // Mercredi
      { id: 'p5', bc: 'BC-2602-2373', client: 'Constructions Modernes', formule: 'F-B20', volume: 80, status: 'completed' },
      { id: 'p6', client: 'BTP Maroc', formule: 'F-B25', volume: 45, status: 'production' },
      { id: 'p7', client: 'Saudi Readymix', formule: 'F-B30', volume: 20, status: 'planned' },
    ]},
    { dayOffset: 3, chips: [ // Jeudi (today)
      { id: 'p8', client: 'Constructions Modernes', formule: 'F-B30', volume: 60, status: 'planned' },
      { id: 'p9', client: 'BTP Maroc', formule: 'F-B25', volume: 35, status: 'planned' },
      { id: 'p10', client: 'Ciments & Béton du Sud', formule: 'F-B20', volume: 30, status: 'urgent' },
    ]},
    { dayOffset: 4, chips: [ // Vendredi
      { id: 'p11', client: 'Saudi Readymix', formule: 'F-B25', volume: 50, status: 'planned' },
      { id: 'p12', client: 'BTP Maroc', formule: 'F-B20', volume: 20, status: 'planned' },
    ]},
    { dayOffset: 5, chips: [ // Samedi
      { id: 'p13', client: 'BTP Maroc', formule: 'F-B25', volume: 35, status: 'planned' },
    ]},
  ];
}

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

export default function PlanningTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const baseDate = useMemo(() => addDays(new Date(), weekOffset * 7), [weekOffset]);
  const weekStart = useMemo(() => startOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekEnd = useMemo(() => endOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const demoData = useMemo(() => getDemoData(), []);

  // Map chips by day offset
  const chipsByDayOffset = useMemo(() => {
    const map: Record<number, PlanningChip[]> = {};
    demoData.forEach(d => { map[d.dayOffset] = d.chips; });
    return map;
  }, [demoData]);

  // All chips flat
  const allChips = useMemo(() => demoData.flatMap(d => d.chips), [demoData]);

  // Selected day chips
  const selectedDayChips = useMemo(() => {
    if (!selectedDate) return [];
    const dayIdx = weekDays.findIndex(d => isSameDay(d, selectedDate));
    return chipsByDayOffset[dayIdx] || [];
  }, [selectedDate, weekDays, chipsByDayOffset]);

  // KPI values (hardcoded for demo realism)
  const weekCount = 18;
  const weekVolume = 1240;
  const avgDay = 207;

  return (
    <div className="flex flex-col gap-6">

      {/* Header + Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 4 }}>Planning de Production</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Vue hebdomadaire des livraisons planifiées</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: T.gold, border: 'none', color: '#000',
            fontWeight: 600, fontSize: 12,
          }}>
            <Plus size={14} /> Nouvelle Planification
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${T.cardBorder}`,
            color: T.textSec, fontWeight: 500, fontSize: 12,
          }}>
            <Upload size={14} /> Importer BC
          </button>

          {/* Nav */}
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
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '14px 16px' }}>
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

        {/* Week grid */}
        <div className="flex-1">
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Day headers */}
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              {weekDays.map(day => (
                <div key={day.toISOString()} style={{
                  padding: '12px 8px', textAlign: 'center',
                  background: isToday(day) ? `${T.gold}0D` : isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent',
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
              ))}
            </div>

            {/* Day cells */}
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
                      background: isSelected ? 'rgba(212,168,67,0.06)' : isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent',
                      opacity: isPast ? 0.4 : 1,
                      transition: 'background 150ms',
                      minHeight: 120,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isWeekend(day) ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                  >
                    {dayChips.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {dayChips.map(chip => {
                          const cs = chipStyle(chip.status);
                          return (
                            <div key={chip.id} style={{
                              padding: '6px 8px', borderRadius: 6,
                              background: cs.bg, borderLeft: `2px solid ${cs.border}`,
                              overflow: 'hidden',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {chip.bc ? `${chip.bc} · ` : ''}{chip.formule}
                                </span>
                                {chip.status === 'urgent' && (
                                  <span style={{
                                    fontSize: 8, fontWeight: 700, color: T.danger,
                                    background: 'rgba(248,113,113,0.15)', padding: '1px 4px', borderRadius: 3,
                                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
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
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center', paddingTop: 30 }}>—</p>
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
            borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.cardBorder}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {selectedDate ? format(selectedDate, 'EEEE dd MMMM', { locale: fr }) : 'Détail du jour'}
              </span>
              {selectedDate && selectedDayChips.length > 0 && (
                <p style={{ fontSize: 11, color: T.gold, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  {selectedDayChips.length} livraison{selectedDayChips.length > 1 ? 's' : ''} · {selectedDayChips.reduce((s, c) => s + c.volume, 0)}m³
                </p>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="scrollbar-thin">
              {selectedDate ? (
                selectedDayChips.length > 0 ? (
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
