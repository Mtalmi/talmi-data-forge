import { useState, useMemo } from 'react';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface OrderCalendarViewProps {
  bcList: BonCommande[];
  onSelectBc: (bc: BonCommande) => void;
}

/* ── Seed data for visual richness ── */
const SEED_DELIVERIES: Record<string, { vol: string; formule: string }[]> = {
  '2026-03-10': [{ vol: '30m³', formule: 'B25' }],
  '2026-03-11': [{ vol: '25m³', formule: 'B30' }, { vol: '20m³', formule: 'B20' }],
  '2026-03-12': [{ vol: '40m³', formule: 'B25' }, { vol: '25m³', formule: 'B30' }, { vol: '15m³', formule: 'B20' }],
  '2026-03-13': [{ vol: '35m³', formule: 'B20' }, { vol: '25m³', formule: 'B25' }],
  '2026-03-14': [{ vol: '10m³', formule: 'B20' }, { vol: '15m³', formule: 'B20' }],
  '2026-03-17': [{ vol: '35m³', formule: 'B30' }],
  '2026-03-18': [{ vol: '30m³', formule: 'B25' }, { vol: '20m³', formule: 'B20' }],
  '2026-03-19': [{ vol: '40m³', formule: 'B30' }],
};

const FORMULE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  B25: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#22C55E' },
  B30: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B' },
  B20: { bg: 'rgba(212,168,67,0.12)', border: 'rgba(212,168,67,0.3)', color: '#D4A843' },
};

function getFormuleFromId(formuleId: string): string {
  if (formuleId.includes('B30') || formuleId.includes('b30')) return 'B30';
  if (formuleId.includes('B25') || formuleId.includes('b25')) return 'B25';
  return 'B20';
}

export function OrderCalendarView({ bcList, onSelectBc }: OrderCalendarViewProps) {
  const { t, lang } = useI18n();
  const oc = t.orderCalendar;
  const dateLocale = getDateLocale(lang);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const ordersByDate = useMemo(() => {
    const map = new Map<string, BonCommande[]>();
    bcList.forEach(bc => {
      if (bc.date_livraison_souhaitee) {
        const dateKey = format(new Date(bc.date_livraison_souhaitee), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, bc]);
      }
    });
    return map;
  }, [bcList]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const today = startOfDay(new Date());

  const selectedDateOrders = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return ordersByDate.get(dateKey) || [];
  }, [selectedDate, ordersByDate]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

  const isTodaySelected = selectedDate && isToday(selectedDate);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
      {/* Calendar */}
      <div style={{
        background: 'rgba(15,23,41,0.6)',
        border: '1px solid rgba(212,168,67,0.12)',
        borderRadius: 12,
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={16} color="#D4A843" />
            <span style={{ fontFamily: mono, fontSize: 13, color: 'white', fontWeight: 500 }}>{oc.deliveryCalendar}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={goToToday} style={{
              background: '#D4A843', color: '#0F1629', border: 'none', borderRadius: 6,
              padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontFamily: mono, fontWeight: 600,
            }}>
              Aujourd'hui
            </button>
            <button onClick={goToPrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4A843', padding: 4, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8C96A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#D4A843')}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontFamily: mono, fontWeight: 400, color: 'white', minWidth: 140, textAlign: 'center', fontSize: 14 }}>
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </span>
            <button onClick={goToNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4A843', padding: 4, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8C96A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#D4A843')}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {oc.dayNames.map((day: string) => (
            <div key={day} style={{
              fontFamily: mono, letterSpacing: '2px', fontSize: 11, color: '#D4A843',
              textTransform: 'uppercase', textAlign: 'center', padding: '6px 0', fontWeight: 600,
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayOrders = ordersByDate.get(dateKey) || [];
            const seedItems = SEED_DELIVERIES[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const isPast = isBefore(day, today) && !isDayToday;
            const hasDeliveries = dayOrders.length > 0 || seedItems.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: 80,
                  padding: 8,
                  borderRadius: 8,
                  border: isDayToday ? '1px solid #D4A843' : isSelected ? '1px solid rgba(212,168,67,0.3)' : '1px solid rgba(255,255,255,0.04)',
                  background: isDayToday ? 'rgba(212,168,67,0.15)' : isSelected ? 'rgba(212,168,67,0.06)' : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 200ms',
                }}
                onMouseEnter={e => { if (!isDayToday && !isSelected) e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                onMouseLeave={e => { if (!isDayToday && !isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <span style={{
                    fontSize: 13, fontWeight: isDayToday ? 600 : 500,
                    color: isDayToday ? '#D4A843' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(226,232,240,0.7)',
                    fontFamily: mono,
                  }}>
                    {format(day, 'd')}
                  </span>
                  {hasDeliveries && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', marginTop: 1 }} />
                  )}
                </div>

                {/* Real orders */}
                {dayOrders.slice(0, 2).map((order) => {
                  const f = getFormuleFromId(order.formule_id);
                  const fs = FORMULE_STYLES[f] || FORMULE_STYLES.B20;
                  return (
                    <div key={order.bc_id} style={{
                      fontSize: 11, fontFamily: mono, padding: '1px 5px', borderRadius: 4, marginTop: 2,
                      background: fs.bg, border: `1px solid ${fs.border}`, color: fs.color,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {order.volume_m3}m³
                    </div>
                  );
                })}

                {/* Seed items (only if no real orders) */}
                {dayOrders.length === 0 && seedItems.slice(0, 2).map((s, i) => {
                  const fs = FORMULE_STYLES[s.formule] || FORMULE_STYLES.B20;
                  return (
                    <div key={i} style={{
                      fontSize: 11, fontFamily: mono, padding: '1px 5px', borderRadius: 4, marginTop: 2,
                      background: fs.bg, border: `1px solid ${fs.border}`, color: fs.color,
                    }}>
                      {s.vol}
                    </div>
                  );
                })}

                {(dayOrders.length + (dayOrders.length === 0 ? seedItems.length : 0)) > 2 && (
                  <div style={{ fontSize: 9, color: '#9CA3AF', paddingLeft: 2, marginTop: 1, fontFamily: mono }}>
                    +{(dayOrders.length > 0 ? dayOrders.length : seedItems.length) - 2}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Prêt', color: '#D4A843' },
            { label: 'En Production', color: '#F59E0B' },
            { label: 'Terminé/Livré', color: '#22C55E' },
          ].map(l => (
            <span key={l.label} style={{
              fontFamily: mono, fontSize: 11, color: l.color,
              border: `1px solid ${l.color}`, borderRadius: 100,
              padding: '2px 10px', background: 'rgba(255,255,255,0.02)',
            }}>
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{
        background: 'rgba(15,23,41,0.6)',
        border: '1px solid rgba(212,168,67,0.12)',
        borderRadius: 12,
        padding: 24,
      }}>
        {isTodaySelected && selectedDateOrders.length === 0 ? (
          /* Hardcoded today content */
          <>
            <h4 style={{ fontFamily: mono, fontSize: 16, color: 'white', fontWeight: 500, marginBottom: 4 }}>
              Samedi 14 Mars 2026
            </h4>
            <p style={{ fontFamily: mono, color: '#D4A843', fontSize: 13, marginBottom: 16 }}>
              2 livraisons · 25m³ total
            </p>

            {/* Card 1 */}
            <div style={{
              borderLeft: '3px solid #22C55E', background: 'rgba(212,168,67,0.02)',
              padding: 12, borderRadius: 8, marginBottom: 8, transition: 'background 200ms', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.02)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843', fontWeight: 500 }}>BC-2024-003</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843' }}>08:00</span>
              </div>
              <p style={{ fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 4 }}>Ciments & Béton du Sud</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#9CA3AF' }}>F-B20 · 10 m³</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '2px 8px' }}>● Prêt</span>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{
              borderLeft: '3px solid #22C55E', background: 'rgba(212,168,67,0.02)',
              padding: 12, borderRadius: 8, marginBottom: 16, transition: 'background 200ms', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.02)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843', fontWeight: 500 }}>BC-2603-6283</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843' }}>10:30</span>
              </div>
              <p style={{ fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 4 }}>Constructions Modernes SA</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#9CA3AF' }}>F-B20 · 15 m³</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '2px 8px' }}>● Prêt</span>
              </div>
            </div>

            {/* Résumé journée */}
            <div>
              <p style={{ fontFamily: mono, letterSpacing: '1.5px', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
                RÉSUMÉ JOURNÉE
              </p>
              {[
                { label: 'Volume', value: '25 m³' },
                { label: 'Revenu estimé', value: '18,200 DH' },
                { label: 'Toupies nécessaires', value: '1' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#9CA3AF' }}>{r.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : selectedDate ? (
          <>
            <h4 style={{ fontFamily: mono, fontSize: 16, color: 'white', fontWeight: 500, marginBottom: 8 }}>
              {format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })}
            </h4>
            {selectedDateOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Package size={40} color="rgba(148,163,184,0.3)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: mono }}>{oc.noOrdersPlanned}</p>
              </div>
            ) : (
              <ScrollArea style={{ maxHeight: 420 }}>
                <p style={{ fontFamily: mono, color: '#D4A843', fontSize: 13, marginBottom: 12 }}>
                  {selectedDateOrders.length} livraison{selectedDateOrders.length > 1 ? 's' : ''} · {selectedDateOrders.reduce((s, o) => s + o.volume_m3, 0)}m³ total
                </p>
                {selectedDateOrders.map(bc => (
                  <div
                    key={bc.bc_id}
                    onClick={() => onSelectBc(bc)}
                    style={{
                      borderLeft: '3px solid #22C55E', background: 'rgba(212,168,67,0.02)',
                      padding: 12, borderRadius: 8, marginBottom: 8, cursor: 'pointer', transition: 'background 200ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.02)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843', fontWeight: 500 }}>{bc.bc_id}</span>
                      {bc.heure_livraison_souhaitee && (
                        <span style={{ fontFamily: mono, fontSize: 12, color: '#D4A843' }}>{bc.heure_livraison_souhaitee.substring(0, 5)}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 4 }}>
                      {bc.client?.nom_client || bc.client_id}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: mono, fontSize: 11, color: '#9CA3AF' }}>
                        {bc.formule_id} · {bc.volume_m3} m³
                      </span>
                      <span style={{
                        fontFamily: mono, fontSize: 10,
                        color: bc.statut === 'pret_production' ? '#D4A843' : bc.statut === 'en_production' ? '#F59E0B' : '#22C55E',
                        background: bc.statut === 'pret_production' ? 'rgba(212,168,67,0.1)' : bc.statut === 'en_production' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                        border: `1px solid ${bc.statut === 'pret_production' ? 'rgba(212,168,67,0.3)' : bc.statut === 'en_production' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius: 100, padding: '2px 8px',
                      }}>
                        ● {bc.statut === 'pret_production' ? 'Prêt' : bc.statut === 'en_production' ? 'Production' : 'Livré'}
                      </span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CalendarIcon size={40} color="rgba(148,163,184,0.3)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: mono }}>{oc.clickDateToView}</p>
          </div>
        )}
      </div>
    </div>
  );
}
