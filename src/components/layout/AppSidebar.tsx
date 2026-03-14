import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreviewRole } from '@/hooks/usePreviewRole';
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
  const { user, signOut, isCentraliste, isResponsableTechnique, isAuditeur, isCeo, isSuperviseur } = useAuth();
  const { previewRole } = usePreviewRole();
  const { t } = useI18n();
  const nav = t.nav as Record<string, string>;
  
  const effCentraliste = isCentraliste || previewRole === 'centraliste';
  const effRespTech = isResponsableTechnique || previewRole === 'responsable_technique';
  const effAuditeur = isAuditeur || previewRole === 'auditeur';
  
  const blockedRoutes = useMemo(() => {
    const blocked = new Set<string>();
    if (effCentraliste) {
      blocked.add('/stocks');
      blocked.add('/ventes');
      blocked.add('/clients');
    }
    if (effRespTech) {
      blocked.add('/ventes');
      blocked.add('/planning');
    }
    return blocked;
  }, [effCentraliste, effRespTech]);

  const sections: NavSection[] = useMemo(() => [
    {
      key: 'command-center',
      label: 'COMMAND CENTER',
      items: [
        { title: nav.dashboard || 'Tableau de Bord', url: '/', icon: LayoutDashboard },
        { title: nav.production || 'Production', url: '/production', icon: Factory },
        { title: nav.planning || 'Planning', url: '/planning', icon: CalendarDays },
      ],
    },
    {
      key: 'operations',
      label: nav.sectionOperations || 'OPÉRATIONS',
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
      label: nav.sectionFinance || 'FINANCE',
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
      label: nav.sectionResources || 'RESSOURCES',
      items: [
        { title: nav.contractors || 'Prestataires', url: '/prestataires', icon: Handshake },
        { title: nav.maintenance || 'Maintenance', url: '/maintenance', icon: Wrench },
        { title: nav.suppliers || 'Fournisseurs', url: '/fournisseurs', icon: PackageSearch },
        { title: nav.attendance || 'Pointage', url: '/pointage', icon: Clock },
      ],
    },
    {
      key: 'intelligence',
      label: nav.sectionIntelligence || 'INTELLIGENCE',
      items: [
        { title: nav.aiAgent || 'Agent IA', url: '/operations-agent', icon: Bot, badge: '●' },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: nav.alerts || 'Alertes', url: '/alertes', icon: Bell },
        { title: nav.reports || 'Rapports', url: '/rapports', icon: BarChart3 },
        { title: 'Design Guardian', url: '/design-guardian', icon: Shield },
      ],
    },
    {
      key: 'administration',
      label: nav.sectionAdmin || 'ADMINISTRATION',
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

  const filteredSections = useMemo(() => {
    if (blockedRoutes.size === 0) return sections;
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => !blockedRoutes.has(item.url)),
    })).filter(section => section.items.length > 0);
  }, [sections, blockedRoutes]);

  const activeSectionKeys = useMemo(() => {
    const keys: string[] = [];
    for (const s of filteredSections) {
      if (s.items.some(item => {
        if (item.url === '/') return location.pathname === '/' || location.pathname === '/dashboard';
        return location.pathname === item.url;
      })) {
        keys.push(s.key);
      }
    }
    return keys;
  }, [location.pathname, filteredSections]);

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
    if (window.innerWidth < 768) onClose();
  };

  const userEmail = user?.email || '';
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Max';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        width: '16rem',
        background: '#0B1120',
        borderRight: '1px solid rgba(212, 168, 67, 0.08)',
      }}
    >
      {/* Gold edge highlight */}
      <div className="absolute top-0 left-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, rgba(212,168,67,0.4) 0%, rgba(212,168,67,0.08) 50%, transparent 100%)' }} />

      {/* ── BRAND HEADER ── */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center tbos-sidebar-logo"
            style={{
              background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)',
              boxShadow: '0 4px 16px rgba(212, 168, 67, 0.3), 0 0 24px rgba(212, 168, 67, 0.15)',
            }}
          >
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 16, fontWeight: 700, color: '#0B1120' }}>T</span>
          </div>
          <div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 18, fontWeight: 700, color: '#D4A843', letterSpacing: '0.05em' }}>TBOS</div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 10, fontWeight: 300, letterSpacing: '3px', color: '#9CA3AF', textTransform: 'uppercase' as const }}>SUITE</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SHORTCUT ── */}
      <div className="flex items-center gap-2 mx-4 my-2 px-3 py-2 rounded-lg cursor-default select-none shrink-0" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(212, 168, 67, 0.15)', borderRadius: 8 }}>
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#9CA3AF' }}>Recherche...</span>
        <span className="ml-auto" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', color: '#9CA3AF' }}>⌘K</span>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2 tbos-sidebar-scroll" style={{ scrollbarWidth: 'thin' }}>
        {filteredSections.map((section, si) => {
          const isOpen = openSections[section.key] ?? false;
          const sectionHasActive = section.items.some(item => isActive(item.url));

          return (
            <div key={section.key}>
              {/* Divider above section */}
              {si > 0 && (
                <div className="mx-5 mt-2" style={{ height: '1px', background: 'rgba(212,168,67,0.08)' }} />
              )}

              {/* Section header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="flex items-center gap-2 w-full px-5 group cursor-pointer"
                style={{ paddingTop: si === 0 ? '4px' : '20px', paddingBottom: '10px' }}
              >
                <ChevronDown
                  className="w-3 h-3 transition-transform duration-200 flex-shrink-0"
                  style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', color: 'rgba(212,168,67,0.3)' }}
                  strokeWidth={2.5}
                />
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: 10,
                    letterSpacing: '2px',
                    fontWeight: 600,
                    color: sectionHasActive ? '#D4A843' : '#9CA3AF',
                    textTransform: 'uppercase' as const,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {section.label}
                </span>
                <div className="flex-1" />
                {!isOpen && (
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: 'rgba(212,168,67,0.2)' }}>{section.items.length}</span>
                )}
              </button>

              {/* Items */}
              <div
                className="overflow-hidden transition-all duration-250 ease-in-out"
                style={{
                  maxHeight: isOpen ? `${section.items.length * 40 + 8}px` : '0px',
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
                        className="relative w-full flex items-center gap-3 px-4 py-2 mx-3 rounded-lg text-left transition-all duration-200 group cursor-pointer"
                        style={{
                          width: 'calc(100% - 24px)',
                          ...(active ? {
                            background: 'rgba(212, 168, 67, 0.1)',
                            borderLeft: '3px solid #D4A843',
                          } : {}),
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.08)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <item.icon
                          className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200"
                          strokeWidth={1.5}
                          style={{ color: active ? '#D4A843' : '#9CA3AF' }}
                        />
                        <span
                          className="flex-1 truncate transition-colors duration-200"
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            color: active ? '#D4A843' : '#9CA3AF',
                          }}
                        >
                          {item.title}
                        </span>
                        {item.badge && item.badge !== '●' && (
                          <span
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              fontSize: 10,
                              fontWeight: 600,
                              background: '#EF4444',
                              color: '#FFFFFF',
                              borderRadius: '50%',
                              minWidth: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 4px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.badge === '●' && (
                          <span className="flex items-center justify-center w-5 h-5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
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
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(212, 168, 67, 0.06)' }}>
        <div
          className="mx-4 my-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
          style={{
            background: 'rgba(212, 168, 67, 0.02)',
            border: '1px solid rgba(212, 168, 67, 0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: '#D4A843',
                  color: '#0F1629',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </div>
               <div
                 className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"
                 style={{ border: '2px solid #0B1120' }}
               />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: '#FFFFFF', fontWeight: 600 }} className="truncate">{userName} Talmi</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9CA3AF' }} className="truncate">Directeur Général</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); signOut(); }}
              className="p-1.5 rounded-md transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
