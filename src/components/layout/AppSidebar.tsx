import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import {
  LayoutDashboard, Factory, CalendarDays, ShoppingCart, Users,
  Package, FlaskConical, Truck, FileText, Receipt,
  Wallet, CreditCard, Landmark, Building2, ArrowLeftRight,
  Handshake, Wrench, PackageSearch, Clock,
  Bot, BarChart3, Bell, Shield, BookOpen, CheckSquare,
  Search, User, Settings, LogOut, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useI18n();

  const nav = t.nav as Record<string, string>;

  const sections: NavSection[] = [
    {
      label: 'Command Center',
      items: [
        { title: nav.dashboard || 'Tableau de Bord', url: '/', icon: LayoutDashboard },
        { title: nav.production || 'Production', url: '/production', icon: Factory },
        { title: nav.planning || 'Planning', url: '/planning', icon: CalendarDays },
      ],
    },
    {
      label: nav.sectionOperations || 'Opérations',
      items: [
        { title: nav.sales || 'Ventes', url: '/ventes', icon: ShoppingCart, badge: 6 },
        { title: nav.clients || 'Clients', url: '/clients', icon: Users },
        { title: nav.stocks || 'Stocks', url: '/stocks', icon: Package },
        { title: nav.laboratory || 'Laboratoire', url: '/laboratoire', icon: FlaskConical },
        { title: nav.logistics || 'Logistique', url: '/logistique', icon: Truck },
        { title: nav.deliveries || 'Bons de Commande', url: '/bons', icon: FileText, badge: 3 },
        { title: nav.receivables || 'Créances', url: '/creances', icon: Receipt, badge: 2 },
      ],
    },
    {
      label: nav.sectionFinance || 'Finance',
      items: [
        { title: nav.expenses || 'Dépenses', url: '/depenses', icon: Wallet },
        { title: nav.payments || 'Paiements', url: '/paiements', icon: CreditCard },
        { title: nav.debts || 'Dettes', url: '/dettes', icon: Landmark },
        { title: nav.fixedAssets || 'Immobilisations', url: '/immobilisations', icon: Building2 },
        { title: nav.reconciliation || 'Rapprochement', url: '/rapprochement', icon: ArrowLeftRight },
      ],
    },
    {
      label: nav.sectionResources || 'Ressources',
      items: [
        { title: nav.contractors || 'Prestataires', url: '/prestataires', icon: Handshake },
        { title: nav.maintenance || 'Maintenance', url: '/maintenance', icon: Wrench },
        { title: nav.suppliers || 'Fournisseurs', url: '/fournisseurs', icon: PackageSearch },
        { title: nav.attendance || 'Pointage', url: '/pointage', icon: Clock },
      ],
    },
    {
      label: nav.sectionIntelligence || 'Intelligence',
      items: [
        { title: nav.aiAgent || 'Agent IA', url: '/operations-agent', icon: Bot, badge: '●' },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: nav.alerts || 'Alertes', url: '/alertes', icon: Bell },
        { title: nav.reports || 'Rapports', url: '/rapports', icon: BarChart3 },
      ],
    },
    {
      label: nav.sectionAdmin || 'Administration',
      items: [
        { title: nav.profile || 'Profil', url: '/user_profile', icon: User },
        { title: nav.security || 'Sécurité', url: '/securite', icon: Shield },
        { title: nav.auditLog || 'Journal', url: '/journal', icon: BookOpen },
        { title: nav.approvals || 'Approbations', url: '/approbations', icon: CheckSquare },
        { title: nav.supervisorAudit || 'Audit', url: '/audit-superviseur', icon: Search },
        { title: nav.settings || 'Paramètres', url: '/settings', icon: Settings },
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
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Max';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 w-56 z-40 flex flex-col transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(10, 13, 23, 0.99) 0%, rgba(8, 11, 20, 1) 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* ── BRAND HEADER ── */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #D4A843 0%, #B8922F 100%)',
              boxShadow: '0 2px 8px rgba(212, 168, 67, 0.25)',
            }}
          >
            <span className="text-sm font-black text-black/80 tracking-tight">T</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">TBOS</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Suite</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SHORTCUT ── */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Search className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
          <span className="text-[11px] text-gray-500 flex-1">Recherche rapide...</span>
          <div className="flex items-center gap-0.5">
            <kbd className="text-[9px] text-gray-600 px-1 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.05)' }}>⌘</kbd>
            <kbd className="text-[9px] text-gray-600 px-1 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.05)' }}>K</kbd>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {sections.map((section, si) => (
          <div key={section.label}>
            {/* Section header with extending line */}
            <div className={cn('px-4 pb-1.5', si === 0 ? 'pt-1' : 'pt-5')}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold whitespace-nowrap">
                  {section.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>

            {/* Section items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.url);
                return (
                  <button
                    key={item.url}
                    onClick={() => handleNav(item.url)}
                    className={cn(
                      'relative w-full flex items-center gap-2.5 px-3 py-1.5 mx-2 rounded-lg text-left transition-all duration-150 group cursor-pointer',
                      active
                        ? 'text-[#D4A843] font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    )}
                    style={{
                      width: 'calc(100% - 16px)',
                      ...(active
                        ? { background: 'rgba(212, 168, 67, 0.08)' }
                        : {}),
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {/* Active gold left bar */}
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                        style={{ background: '#D4A843' }}
                      />
                    )}

                    {/* Icon */}
                    <item.icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors duration-150',
                        active ? '' : 'text-gray-500 group-hover:text-gray-400'
                      )}
                      strokeWidth={1.5}
                      style={active ? { color: '#D4A843' } : undefined}
                    />

                    {/* Label */}
                    <span className={cn('text-[13px] flex-1 truncate', active ? 'font-semibold' : 'font-medium')}>
                      {item.title}
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span
                        className={cn(
                          'flex items-center justify-center rounded-full font-bold',
                          item.badge === '●' ? 'text-[8px] w-4 h-4' : 'text-[9px] min-w-[18px] h-[18px] px-1'
                        )}
                        style={{
                          background: 'rgba(212, 168, 67, 0.15)',
                          color: '#D4A843',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── USER PROFILE CARD ── */}
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="mx-3 my-3 p-3 rounded-xl cursor-pointer transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Avatar with status ring */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.1) 100%)',
                  color: '#D4A843',
                  border: '1.5px solid rgba(212, 168, 67, 0.3)',
                }}
              >
                {userInitials}
              </div>
              {/* Online status dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"
                style={{ border: '2px solid rgb(10, 13, 23)' }}
              />
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-semibold truncate">{userName} Talmi</div>
              <div className="text-[9px] text-gray-500 truncate">Directeur Général</div>
            </div>

            {/* Logout */}
            <button
              onClick={(e) => { e.stopPropagation(); signOut(); }}
              className="p-1 rounded-md text-gray-600 hover:text-gray-400 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
