import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import {
  LayoutDashboard, Factory, CalendarDays, ShoppingCart, Users,
  Package, FlaskConical, Truck, FileText, Receipt,
  Wallet, CreditCard, Landmark, Building2, ArrowLeftRight,
  Handshake, Wrench, PackageSearch, Clock,
  Bot, BarChart3, Bell, Shield, BookOpen, CheckSquare,
  Search, User, Settings, LogOut, TrendingUp, ChevronDown,
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
  key: string;
  label: string;
  items: NavItem[];
}

const DEFAULT_OPEN: Record<string, boolean> = {
  'command-center': true,
  'operations': true,
  'finance': false,
  'ressources': false,
  'intelligence': false,
  'administration': false,
};

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const nav = t.nav as Record<string, string>;

  const sections: NavSection[] = useMemo(() => [
    {
      key: 'command-center',
      label: 'Command Center',
      items: [
        { title: nav.dashboard || 'Tableau de Bord', url: '/', icon: LayoutDashboard },
        { title: nav.production || 'Production', url: '/production', icon: Factory },
        { title: nav.planning || 'Planning', url: '/planning', icon: CalendarDays },
      ],
    },
    {
      key: 'operations',
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
      key: 'finance',
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
      key: 'ressources',
      label: nav.sectionResources || 'Ressources',
      items: [
        { title: nav.contractors || 'Prestataires', url: '/prestataires', icon: Handshake },
        { title: nav.maintenance || 'Maintenance', url: '/maintenance', icon: Wrench },
        { title: nav.suppliers || 'Fournisseurs', url: '/fournisseurs', icon: PackageSearch },
        { title: nav.attendance || 'Pointage', url: '/pointage', icon: Clock },
      ],
    },
    {
      key: 'intelligence',
      label: nav.sectionIntelligence || 'Intelligence',
      items: [
        { title: nav.aiAgent || 'Agent IA', url: '/operations-agent', icon: Bot, badge: '●' },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: nav.alerts || 'Alertes', url: '/alertes', icon: Bell },
        { title: nav.reports || 'Rapports', url: '/rapports', icon: BarChart3 },
      ],
    },
    {
      key: 'administration',
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
  ], [nav]);

  // Auto-open section containing the active route
  const activeSectionKeys = useMemo(() => {
    const keys: string[] = [];
    for (const s of sections) {
      if (s.items.some(item => {
        if (item.url === '/') return location.pathname === '/' || location.pathname === '/dashboard';
        return location.pathname === item.url;
      })) {
        keys.push(s.key);
      }
    }
    return keys;
  }, [location.pathname, sections]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial = { ...DEFAULT_OPEN };
    for (const key of activeSectionKeys) initial[key] = true;
    return initial;
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
        background: 'linear-gradient(180deg, #141824, #11182E)',
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

      {/* ── SEARCH SHORTCUT (display-only) ── */}
      <div className="flex items-center gap-2 mx-3 my-2 px-3 py-1.5 rounded-lg cursor-default select-none shrink-0" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
        <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
        <span className="text-gray-500 text-xs">Recherche...</span>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
        {sections.map((section, si) => {
          const isOpen = openSections[section.key] ?? false;
          const sectionHasActive = section.items.some(item => isActive(item.url));

          return (
            <div key={section.key}>
              {/* Collapsible section header */}
              <button
                onClick={() => toggleSection(section.key)}
                className={cn(
                  'flex items-center gap-1.5 w-full px-4 pb-1 group cursor-pointer',
                  si === 0 ? 'pt-1' : 'pt-3.5'
                )}
              >
                <ChevronDown
                  className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-transform duration-200 flex-shrink-0"
                  style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  strokeWidth={2}
                />
                <span className={cn(
                  'text-[9px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition-colors',
                  sectionHasActive ? 'text-gray-500' : 'text-gray-600 group-hover:text-gray-500'
                )}>
                  {section.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                {!isOpen && (
                  <span className="text-[8px] text-gray-600 font-mono tabular-nums">{section.items.length}</span>
                )}
              </button>

              {/* Animated items container */}
              <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{
                  maxHeight: isOpen ? `${section.items.length * 36 + 8}px` : '0px',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="py-0.5">
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
                          ...(active ? { background: 'rgba(212, 168, 67, 0.08)' } : {}),
                        }}
                        onMouseEnter={e => {
                          if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={e => {
                          if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {active && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                            style={{ background: '#D4A843' }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            'w-4 h-4 flex-shrink-0 transition-colors duration-150',
                            active ? '' : 'text-gray-500 group-hover:text-gray-400'
                          )}
                          strokeWidth={1.5}
                          style={active ? { color: '#D4A843' } : undefined}
                        />
                        <span className={cn('text-[13px] flex-1 truncate', active ? 'font-semibold' : 'font-medium')}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              'flex items-center justify-center rounded-full font-bold',
                              item.badge === '●' ? 'text-[8px] w-4 h-4' : 'text-[9px] min-w-[18px] h-[18px] px-1'
                            )}
                            style={
                              item.badge === '●'
                                ? { color: '#22c55e' }
                                : { background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843' }
                            }
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── USER PROFILE CARD ── */}
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(245, 158, 11, 0.08)' }}>
        <div
          className="mx-3 my-3 p-3 rounded-xl cursor-pointer transition-colors"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div className="flex items-center gap-2.5">
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
               <div
                 className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"
                 style={{ border: '2px solid #141824' }}
               />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-semibold truncate">{userName} Talmi</div>
              <div className="text-[9px] text-gray-500 truncate">Directeur Général</div>
            </div>
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
