import { CalendarClock, Plus } from 'lucide-react';
import { tbosToast } from '@/hooks/useTbosToast';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

const SCHEDULES = [
  { name: 'Briefing Matinal', schedule: 'Tous les jours · 06:00 · Email + WhatsApp', active: true },
  { name: 'Rapport Hebdomadaire', schedule: 'Chaque lundi · 08:00 · Email (PDF)', active: true },
  { name: 'Rapport Mensuel P&L', schedule: '1er du mois · 09:00 · Email (Excel + PDF)', active: true },
];

export function ScheduledReportsSection() {
  const handleToast = () => tbosToast('Fonctionnalité de modification disponible prochainement');

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CalendarClock size={14} style={{ color: '#D4A843' }} />
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#D4A843', letterSpacing: '1px' }}>
            ✦ RAPPORTS PROGRAMMÉS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SCHEDULES.map((s, i) => (
            <div key={i} style={{
              borderLeft: '3px solid #22C55E',
              fontFamily: MONO, fontSize: 12,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '0 8px 8px 0',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: '#64748B', marginLeft: 8 }}>— {s.schedule}</span>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E',
              }}>
                Actif
              </span>
              <button
                onClick={handleToast}
                style={{
                  fontFamily: MONO, fontSize: 10, color: '#64748B',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '2px 6px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
              >
                {i === 0 ? 'Programmer' : 'Modifier'}
              </button>
            </div>
          ))}

          <button
            onClick={handleToast}
            style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(212,168,67,0.3)',
              color: '#D4A843', cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Plus size={13} />
            Nouveau Rapport
          </button>
        </div>
      </div>
    </div>
  );
}
