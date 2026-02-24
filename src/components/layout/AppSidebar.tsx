import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import {
  LayoutDashboard, Factory, CalendarClock, Truck, DollarSign, Warehouse,
  Users, BarChart3, Settings, LogOut, FlaskConical, TruckIcon, CreditCard,
  Landmark, Building2, RefreshCcw, Wrench, HardHat, Package, Clock, Bot,
  TrendingUp, Bell, FileText, Shield, BookOpen, CheckSquare, Search, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  tier: 'command' | 'ops' | 'finance' | 'admin';
  items: NavItem[];
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { t } = useI18n();

  const nav = t.nav as Record<string, string>;

  const sections: NavSection[] = [
    {
      label: 'Command Center',
      tier: 'command',
      items: [
        { title: nav.dashboard || 'Dashboard', url: '/', icon: LayoutDashboard },
        { title: nav.production || 'Production', url: '/production', icon: Factory },
        { title: nav.planning || 'Planning', url: '/planning', icon: CalendarClock },
      ],
    },
    {
      label: nav.sectionOperations || 'Operations',
      tier: 'ops',
      items: [
        { title: nav.sales || 'Sales', url: '/ventes', icon: DollarSign },
        { title: nav.clients || 'Clients', url: '/clients', icon: Users },
        { title: nav.stocks || 'Stocks', url: '/stocks', icon: Warehouse },
        { title: nav.laboratory || 'Laboratory', url: '/laboratoire', icon: FlaskConical },
        { title: nav.logistics || 'Logistique', url: '/logistique', icon: TruckIcon },
        { title: nav.deliveries || 'Livraisons', url: '/bons', icon: Truck },
        { title: nav.receivables || 'Créances', url: '/creances', icon: FileText },
      ],
    },
    {
      label: nav.sectionFinance || 'Finance',
      tier: 'finance',
      items: [
        { title: nav.expenses || 'Dépenses', url: '/depenses', icon: CreditCard },
        { title: nav.payments || 'Paiements', url: '/paiements', icon: Landmark },
        { title: nav.debts || 'Dettes', url: '/dettes', icon: Building2 },
        { title: nav.fixedAssets || 'Immobilisations', url: '/immobilisations', icon: Package },
        { title: nav.reconciliation || 'Rapprochement', url: '/rapprochement', icon: RefreshCcw },
      ],
    },
    {
      label: nav.sectionResources || 'Ressources',
      tier: 'ops',
      items: [
        { title: nav.contractors || 'Prestataires', url: '/prestataires', icon: HardHat },
        { title: nav.maintenance || 'Maintenance', url: '/maintenance', icon: Wrench },
        { title: nav.suppliers || 'Fournisseurs', url: '/fournisseurs', icon: Package },
        { title: nav.attendance || 'Pointage', url: '/pointage', icon: Clock },
      ],
    },
    {
      label: nav.sectionIntelligence || 'Intelligence',
      tier: 'ops',
      items: [
        { title: nav.aiAgent || 'Agent IA', url: '/operations-agent', icon: Bot },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: nav.alerts || 'Alertes', url: '/alertes', icon: Bell },
        { title: nav.reports || 'Rapports', url: '/rapports', icon: BarChart3 },
      ],
    },
    {
      label: nav.sectionAdmin || 'Administration',
      tier: 'admin',
      items: [
        { title: nav.profile || 'Profil', url: '/user_profile', icon: User },
        { title: nav.security || 'Sécurité', url: '/securite', icon: Shield },
        { title: nav.auditLog || 'Journal', url: '/journal', icon: BookOpen },
        { title: nav.approvals || 'Approbations', url: '/approbations', icon: CheckSquare },
        { title: nav.supervisorAudit || 'Audit', url: '/audit-superviseur', icon: Search },
        { title: nav.settings || 'Settings', url: '/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  const handleNav = (url: string) => {
    navigate(url);
    if (window.innerWidth < 1024) onClose();
  };

  const userEmail = user?.email || '';
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Utilisateur';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();
  const roleLabel = (role || 'user').toUpperCase();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 w-[220px] z-40 flex flex-col transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        background: 'linear-gradient(180deg, #070B12 0%, #060A10 50%, #050810 100%)',
      }}
    >
      {/* Right edge gold spine */}
      <div
        className="absolute top-0 right-0 bottom-0 w-px z-50"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(232,184,75,0.2) 30%, rgba(232,184,75,0.12) 70%, transparent 100%)' }}
      />

      {/* ─── Logo — compact ─── */}
      <div className="px-5 pt-4 pb-3 shrink-0 relative z-[1]">
        <div className="relative inline-block">
          <div className="absolute inset-0 blur-xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.5) 0%, transparent 70%)' }} />
          <div className="relative text-[13px] font-semibold tracking-[0.3em] uppercase" style={{ color: '#E8B84B' }}>
            TBOS
          </div>
        </div>
        <div className="text-[8px] tracking-[0.4em] uppercase text-slate-700 mt-0.5">Suite</div>
      </div>

      {/* ─── Navigation — full-fit, no scroll ─── */}
      <nav className="flex-1 flex flex-col justify-between relative z-[1] min-h-0">
        <div>
          {sections.map((section, si) => (
            <div key={section.label}>
              {/* Section header — refined with opacity transition */}
              <div className={cn('px-5 pb-0.5 transition-opacity duration-500', si === 0 ? 'pt-1' : 'pt-3')}>
                <span className="text-[7px] font-medium uppercase tracking-[0.35em] text-slate-700 transition-colors duration-300 group-hover:text-slate-600"
                  style={{ transition: 'color 0.4s ease, letter-spacing 0.4s ease' }}
                >
                  {section.label}
                </span>
              </div>

              {/* Section items — tight rows */}
              <div>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <button
                      key={item.url}
                      onClick={() => handleNav(item.url)}
                      className={cn(
                        'relative w-full flex items-center gap-2.5 px-5 py-[5px] cursor-pointer text-left group',
                        'text-[11.5px]',
                        active
                          ? 'text-white/90 font-medium'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: 'translateX(0)',
                      }}
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                      }}
                    >
                      {/* Hover sweep */}
                      <span
                        className={cn(
                          'absolute inset-0 rounded-r-md transition-all duration-500 ease-out',
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                        style={{
                          background: active
                            ? 'linear-gradient(90deg, rgba(232,184,75,0.08), rgba(232,184,75,0.02), transparent)'
                            : 'linear-gradient(90deg, rgba(255,255,255,0.02), transparent)',
                        }}
                      />

                      {/* Active gold left bar */}
                      {active && (
                        <span
                          className="absolute left-0 top-[3px] bottom-[3px] w-[2px] rounded-full"
                          style={{
                            background: 'linear-gradient(180deg, #E8B84B, rgba(232,184,75,0.3))',
                            boxShadow: '0 0 8px rgba(232,184,75,0.3)',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className={cn(
                          'shrink-0 relative z-[1] transition-all duration-300 flex items-center justify-center',
                          active ? 'opacity-80' : 'opacity-25 group-hover:opacity-50'
                        )}
                        style={active ? { color: 'rgba(232,184,75,0.7)', filter: 'drop-shadow(0 0 4px rgba(232,184,75,0.2))' } : undefined}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                      </span>

                      {/* Label */}
                      <span
                        className={cn(
                          'truncate relative z-[1] transition-all duration-300',
                          !active && 'group-hover:translate-x-0.5'
                        )}
                      >
                        {item.title}
                      </span>

                      {/* Active beacon */}
                      {active && (
                        <span
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                          style={{
                            background: '#E8B84B',
                            boxShadow: '0 0 6px rgba(232,184,75,0.5)',
                            animation: 'pulse 3s ease-in-out infinite',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ─── User Profile Footer — minimal ─── */}
      <div className="shrink-0 relative z-[1] mt-auto" style={{ borderTop: '1px solid rgba(232,184,75,0.06)' }}>
        <div className="px-4 py-3 flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.08))',
              boxShadow: '0 0 0 1px rgba(232,184,75,0.15)',
            }}
          >
            <span className="text-[10px] font-medium" style={{ color: 'rgba(234,179,8,0.8)' }}>{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white/70 truncate">{userName}</p>
            <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color: 'rgba(232,184,75,0.35)' }}>{roleLabel}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1 rounded-md transition-all duration-300 hover:scale-110"
            style={{ color: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(232,184,75,0.5)'; e.currentTarget.style.background = 'rgba(232,184,75,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'transparent'; }}
            title={nav.logout || 'Logout'}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
