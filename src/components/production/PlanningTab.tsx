import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Factory, Truck,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday, isBefore, startOfDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

const T = {
  gold:       '#D4A843',
  cardBg:     'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  success:    '#10B981',
  warning:    '#F59E0B',
  info:       '#3B82F6',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

interface PlanningBon {
  bl_id: string;
  date_livraison: string;
  heure_prevue: string | null;
  volume_m3: number;
  workflow_status: string | null;
  formule_id: string | null;
  chauffeur_nom: string | null;
  camion_assigne: string | null;
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

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>{message}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{sub}</p>
    </div>
  );
}

export default function PlanningTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [bons, setBons] = useState<PlanningBon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const baseDate = useMemo(() => addDays(new Date(), weekOffset * 7), [weekOffset]);
  const weekStart = useMemo(() => startOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekEnd = useMemo(() => endOfWeek(baseDate, { weekStartsOn: 1 }), [baseDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, date_livraison, heure_prevue, volume_m3, workflow_status, formule_id, chauffeur_nom, camion_assigne')
        .gte('date_livraison', format(weekStart, 'yyyy-MM-dd'))
        .lte('date_livraison', format(weekEnd, 'yyyy-MM-dd'))
        .order('heure_prevue');
      setBons((data || []) as PlanningBon[]);
      setLoading(false);
    })();
  }, [weekStart, weekEnd]);

  // Group bons by date
  const bonsByDate = useMemo(() => {
    const map: Record<string, PlanningBon[]> = {};
    bons.forEach(b => {
      const key = b.date_livraison;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bons]);

  // Selected day bons
  const selectedDayBons = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return bonsByDate[key] || [];
  }, [selectedDate, bonsByDate]);

  // Week summary
  const weekVolume = bons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
  const weekCount = bons.length;

  // Hours for timeline
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 06:00 to 17:00

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 4 }}>Planning de Production</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Vue hebdomadaire des livraisons planifiées</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Week KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Livraisons Semaine', value: weekCount, icon: Truck },
          { label: 'Volume Semaine', value: `${Math.round(weekVolume)} m³`, icon: Factory },
          { label: 'Moyenne/Jour', value: `${weekCount > 0 ? (weekVolume / 5).toFixed(1) : '0'} m³`, icon: Clock },
        ].map(k => (
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '14px 16px' }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{k.label}</span>
              <k.icon size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
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
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700,
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
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayBons = bonsByDate[key] || [];
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
                    {dayBons.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {dayBons.slice(0, 4).map(b => (
                          <div key={b.bl_id} style={{
                            padding: '4px 6px', borderRadius: 4,
                            background: `${T.gold}12`, borderLeft: `2px solid ${T.gold}`,
                            fontSize: 10, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                              {b.heure_prevue?.slice(0, 5) || '—'}
                            </span>
                            <span style={{ color: T.textSec, marginLeft: 4 }}>{b.volume_m3}m³</span>
                          </div>
                        ))}
                        {dayBons.length > 4 && (
                          <span style={{ fontSize: 10, color: T.gold, fontWeight: 600, paddingLeft: 6 }}>
                            +{dayBons.length - 4} de plus
                          </span>
                        )}
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
              {selectedDate && selectedDayBons.length > 0 && (
                <p style={{ fontSize: 11, color: T.gold, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                  {selectedDayBons.length} livraison{selectedDayBons.length > 1 ? 's' : ''} · {Math.round(selectedDayBons.reduce((s, b) => s + b.volume_m3, 0))}m³
                </p>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="scrollbar-thin">
              {selectedDate ? (
                selectedDayBons.length > 0 ? (
                  selectedDayBons.map(b => {
                    const statusColor = b.workflow_status === 'planification' ? T.gold
                      : b.workflow_status === 'production' ? T.info
                      : b.workflow_status === 'validation_technique' ? T.success
                      : T.textDim;
                    return (
                      <div
                        key={b.bl_id}
                        style={{
                          padding: '12px 16px', borderLeft: `3px solid ${statusColor}`,
                          margin: '0 12px 6px', borderRadius: '0 8px 8px 0',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                            {b.bl_id}
                          </span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            {b.heure_prevue?.slice(0, 5) || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: T.gold }}>
                            {b.volume_m3} m³
                          </span>
                          {b.formule_id && (
                            <span style={{ fontSize: 10, color: T.textDim }}>· {b.formule_id}</span>
                          )}
                        </div>
                        {(b.chauffeur_nom || b.camion_assigne) && (
                          <div className="flex items-center gap-2">
                            {b.chauffeur_nom && <span style={{ fontSize: 10, color: T.textSec }}>{b.chauffeur_nom}</span>}
                            {b.camion_assigne && (
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.textDim }}>
                                {b.camion_assigne}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <EmptyState icon={Calendar} message="Aucune livraison" sub="Pas de livraison planifiée ce jour" />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Calendar size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 }}>Sélectionnez un jour</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gold }}>
                    {weekCount} livraison{weekCount !== 1 ? 's' : ''} · {Math.round(weekVolume)}m³ total
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
          <span><span style={{ color: '#fff', fontWeight: 600 }}>{weekCount}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> livraisons</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span><span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(weekVolume)}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> m³</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Semaine du <span style={{ color: T.gold }}>{format(weekStart, 'dd MMM', { locale: fr })}</span></span>
        </div>
      </div>
    </div>
  );
}
