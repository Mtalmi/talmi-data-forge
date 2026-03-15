import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications, type SystemAlert } from '@/hooks/useNotifications';
import { useValueFlash } from '@/hooks/useRealtimeVisuals';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/** Map alert types to display tags & colors */
const TAG_MAP: Record<string, { tag: string; color: string }> = {
  qualite_critique: { tag: 'LABORATOIRE', color: '#EF4444' },
  stock_critique: { tag: 'STOCKS', color: '#EF4444' },
  marge_faible: { tag: 'MARGES', color: '#F59E0B' },
  credit_depasse: { tag: 'CRÉANCES', color: '#EF4444' },
  paiement_retard: { tag: 'PAIEMENTS', color: '#F59E0B' },
  rappel_paiement: { tag: 'RAPPELS', color: '#F59E0B' },
  rappels_automatiques: { tag: 'RAPPELS', color: '#F59E0B' },
  production_anomalie: { tag: 'PRODUCTION', color: '#F59E0B' },
  logistique_conflit: { tag: 'LOGISTIQUE', color: '#F59E0B' },
  prix_hausse: { tag: 'PRIX', color: '#F59E0B' },
  approbation_requise: { tag: 'APPROBATION', color: '#D4A843' },
  escalation: { tag: '🔺 ESCALADE', color: '#EF4444' },
  ecart_production: { tag: 'PRODUCTION', color: '#F59E0B' },
  fuite: { tag: 'FUITE', color: '#EF4444' },
  credit: { tag: 'CRÉDIT', color: '#EF4444' },
  bc_valide: { tag: 'COMMANDE', color: '#22C55E' },
  bc_refuse: { tag: 'COMMANDE', color: '#F59E0B' },
  bc_urgence_nuit: { tag: 'URGENCE', color: '#EF4444' },
  midnight_production: { tag: 'NUIT', color: '#EF4444' },
  credit_override_request: { tag: 'CRÉDIT', color: '#F59E0B' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#22C55E',
};

/** Group consecutive alerts of same type into single entry */
interface DisplayNotif {
  id: string;
  severity: string;
  tag: string;
  tagColor: string;
  message: string;
  time: string;
  unread: boolean;
  count: number;
  route: string;
}

function groupAlerts(alerts: SystemAlert[], getRoute: (a: SystemAlert) => string): DisplayNotif[] {
  const grouped: DisplayNotif[] = [];
  const typeGroups = new Map<string, SystemAlert[]>();

  // Group by type_alerte (only unread ones get grouped)
  for (const alert of alerts) {
    const key = alert.type_alerte;
    if (!typeGroups.has(key)) typeGroups.set(key, []);
    typeGroups.get(key)!.push(alert);
  }

  for (const [type, group] of typeGroups) {
    const tagInfo = TAG_MAP[type] || { tag: type.toUpperCase(), color: '#9CA3AF' };
    const newest = group[0]; // already sorted desc
    const unreadCount = group.filter(a => !a.lu).length;

    if (group.length > 1) {
      // Grouped notification
      grouped.push({
        id: newest.id,
        severity: SEVERITY_COLORS[newest.niveau] || '#9CA3AF',
        tag: tagInfo.tag,
        tagColor: tagInfo.color,
        message: group.length > 1
          ? `${group.length} alertes ${tagInfo.tag.toLowerCase()} — ${newest.titre}`
          : newest.message,
        time: formatTime(newest.created_at),
        unread: unreadCount > 0,
        count: group.length,
        route: getRoute(newest),
      });
    } else {
      grouped.push({
        id: newest.id,
        severity: SEVERITY_COLORS[newest.niveau] || '#9CA3AF',
        tag: tagInfo.tag,
        tagColor: tagInfo.color,
        message: newest.message,
        time: formatTime(newest.created_at),
        unread: !newest.lu,
        count: 1,
        route: getRoute(newest),
      });
    }
  }

  // Sort by unread first, then newest
  grouped.sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    return 0; // preserve original order within same read status
  });

  return grouped.slice(0, 12); // Max 12 items in dropdown
}

function formatTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

/** Fallback demo notifications when no real alerts exist */
const DEMO_NOTIFICATIONS: DisplayNotif[] = [
  { id: 'd1', severity: '#EF4444', tag: 'CRÉANCES', tagColor: '#EF4444', message: 'Sigma Bâtiment: 2 retards consécutifs — 189K DH à risque', time: 'Il y a 2h', unread: true, count: 1, route: '/clients' },
  { id: 'd2', severity: '#F59E0B', tag: 'LABORATOIRE', tagColor: '#F59E0B', message: 'Non-conformité BN-0140 — Slump 22 cm (+10%)', time: 'Il y a 3h', unread: true, count: 1, route: '/laboratoire' },
  { id: 'd3', severity: '#EF4444', tag: 'STOCKS', tagColor: '#EF4444', message: 'Adjuvant autonomie 6,7j — réapprovisionnement recommandé', time: 'Il y a 4h', unread: true, count: 1, route: '/stocks' },
  { id: 'd4', severity: '#22C55E', tag: 'PRODUCTION', tagColor: '#22C55E', message: 'Batch #457-068 complété — 96,8% conformité', time: 'Il y a 6h', unread: false, count: 1, route: '/production' },
];

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { alerts, stats, markAllAsRead, markAsRead, getAlertRoute } = useNotifications();

  const displayItems = useMemo(() => {
    if (alerts.length === 0) return DEMO_NOTIFICATIONS;
    return groupAlerts(alerts, getAlertRoute);
  }, [alerts, getAlertRoute]);

  const unreadCount = alerts.length > 0 ? stats.unread : 3;
  const isDemo = alerts.length === 0;
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
          <span className={badgeBounce} style={{
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
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: '#D4A843' }}>
                NOTIFICATIONS
              </span>
              {isDemo && (
                <span style={{
                  fontFamily: MONO, fontSize: 8, color: '#9CA3AF', background: 'rgba(156,163,175,0.1)',
                  border: '1px solid rgba(156,163,175,0.2)', borderRadius: 3, padding: '1px 5px',
                  letterSpacing: 1,
                }}>DÉMO</span>
              )}
            </div>
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
            {displayItems.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '12px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.04)',
                  borderLeft: `3px solid ${notif.severity}`, cursor: 'pointer',
                  transition: 'background 150ms',
                  opacity: notif.unread ? 1 : 0.7,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={() => {
                  if (!isDemo) markAsRead(notif.id);
                  setOpen(false);
                  navigate(notif.route);
                }}
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
                  {/* Group count */}
                  {notif.count > 1 && (
                    <span style={{
                      fontFamily: MONO, fontSize: 9, color: '#9CA3AF',
                      background: 'rgba(156,163,175,0.1)', borderRadius: 3,
                      padding: '1px 5px',
                    }}>
                      ×{notif.count}
                    </span>
                  )}
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
