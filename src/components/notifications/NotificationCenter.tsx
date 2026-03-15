import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useValueFlash } from '@/hooks/useRealtimeVisuals';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

const DEMO_NOTIFICATIONS = [
  { severity: '#EF4444', tag: 'CRÉANCES', tagColor: '#EF4444', message: 'Sigma Bâtiment: 2 retards consécutifs détectés — 189K DH à risque', time: 'Il y a 2h', unread: true },
  { severity: '#F59E0B', tag: 'LABORATOIRE', tagColor: '#F59E0B', message: 'Non-conformité BN-0140 — Slump 22 cm (+10%). Correction appliquée.', time: 'Il y a 3h', unread: true },
  { severity: '#EF4444', tag: 'STOCKS', tagColor: '#EF4444', message: 'Adjuvant autonomie 6,7j — réapprovisionnement recommandé.', time: 'Il y a 4h', unread: true },
  { severity: '#F59E0B', tag: 'LOGISTIQUE', tagColor: '#F59E0B', message: 'T-04 retard estimé +14 min — trafic A3.', time: 'Il y a 5h', unread: false },
  { severity: '#22C55E', tag: 'PRODUCTION', tagColor: '#22C55E', message: 'Batch #457-068 complété — 96,8% conformité.', time: 'Il y a 6h', unread: false },
  { severity: '#D4A843', tag: 'VENTES', tagColor: '#D4A843', message: 'Deal Scorer: TGCC score 87/100 — relance recommandée.', time: 'Il y a 8h', unread: false },
  { severity: '#EF4444', tag: 'LOGISTIQUE', tagColor: '#EF4444', message: 'T-09 en maintenance — pneus usure détectée.', time: 'Hier 16:30', unread: false },
  { severity: '#22C55E', tag: 'DASHBOARD', tagColor: '#22C55E', message: 'Rapport du Soir généré — 265 m³ produits, 94,8% objectif.', time: 'Hier 20:00', unread: false },
];

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { stats, markAllAsRead } = useNotifications();

  const unreadCount = stats.unread || 3;
  const badgeBounce = useValueFlash(unreadCount, 'badge-bounce', 300);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative flex items-center justify-center cursor-pointer transition-colors duration-200"
        style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'transparent', color: '#9CA3AF', border: 'none',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      >
        <Bell size={16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, transform: 'translate(2px, -2px)',
            minWidth: 16, height: 16, borderRadius: '50%', background: '#EF4444',
            color: '#FFFFFF', fontFamily: MONO, fontSize: 9, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 40, right: 0, width: 400, maxHeight: 500,
          background: '#1A2332', border: '1px solid rgba(212, 168, 67, 0.15)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: '#D4A843' }}>
              NOTIFICATIONS
            </span>
            <button
              onClick={() => { markAllAsRead(); }}
              style={{
                fontFamily: MONO, fontSize: 11, color: '#9CA3AF', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
                transition: 'color 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            >
              Tout marquer lu
            </button>
          </div>

          {/* Items */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {DEMO_NOTIFICATIONS.map((notif, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.04)',
                  borderLeft: `3px solid ${notif.severity}`, cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={() => setOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {/* Tag badge */}
                  <span style={{
                    fontFamily: MONO, fontSize: 9, letterSpacing: 1,
                    color: notif.tagColor, padding: '2px 6px', borderRadius: 3,
                    border: `1px solid ${notif.tagColor}40`,
                    background: `${notif.tagColor}10`,
                  }}>
                    {notif.tag}
                  </span>
                  {/* Unread dot */}
                  {notif.unread && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#D4A843',
                      boxShadow: '0 0 6px rgba(212,168,67,0.5)', marginLeft: 'auto', flexShrink: 0,
                    }} />
                  )}
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: '#FFFFFF', lineHeight: 1.5, margin: 0 }}>
                  {notif.message}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', marginTop: 4, margin: 0 }}>
                  {notif.time}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid rgba(212, 168, 67, 0.08)',
            textAlign: 'center', flexShrink: 0,
          }}>
            <button
              onClick={() => { setOpen(false); navigate('/alertes'); }}
              style={{
                fontFamily: MONO, fontSize: 12, color: '#D4A843', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px 8px',
                transition: 'text-decoration 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
