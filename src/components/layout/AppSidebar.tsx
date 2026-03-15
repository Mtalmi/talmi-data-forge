import { useState, useMemo } from 'react';
import { SystemHealthBar } from './SystemHealthBar';
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
  Search, User, Settings, LogOut, TrendingUp, ChevronRight,
  Sparkles, Brain, FileBarChart, Plug, UserRound, Calculator,
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
  badgeStyle?: 'red' | 'gold' | 'green';
  subtitle?: string;
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
  'intelligence': true,
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
        { title: nav.deliveries || 'Bons de Cmd.', url: '/bons', icon: FileText, badge: 3 },
        { title: nav.receivables || 'Créances', url: '/creances', icon: Receipt, badge: 2 },
      ],
    },
    {
      key: 'finance',
      label: nav.sectionFinance || 'FINANCE',
      items: [
        { title: nav.expenses || 'Dépenses', url: '/depenses', icon: Wallet },
        { title: nav.payments || 'Paiements', url: '/paiements', icon: CreditCard },
        { title: 'Trésorerie', url: '/tresorerie', icon: Landmark },
        { title: 'P&L', url: '/pnl', icon: TrendingUp, badge: 'LIVE', badgeStyle: 'green' },
        { title: 'Budget', url: '/budget', icon: Calculator },
        { title: nav.debts || 'Dettes', url: '/dettes', icon: Landmark },
        { title: nav.fixedAssets || 'Immobilisations', url: '/immobilisations', icon: Building2 },
        { title: nav.reconciliation || 'Rapprochement', url: '/rapprochement', icon: ArrowLeftRight },
      ],
    },
    {
      key: 'ressources',
      label: nav.sectionResources || 'RESSOURCES',
      items: [
        { title: 'Personnel', url: '/personnel', icon: UserRound },
        { title: 'Équipements', url: '/equipements', icon: Wrench },
        { title: 'Fournisseurs', url: '/fournisseurs', icon: Truck },
        { title: nav.contractors || 'Prestataires', url: '/prestataires', icon: Handshake },
        { title: nav.maintenance || 'Maintenance', url: '/maintenance', icon: PackageSearch },
        { title: nav.attendance || 'Pointage', url: '/pointage', icon: Clock },
      ],
    },
    {
      key: 'intelligence',
      label: nav.sectionIntelligence || 'INTELLIGENCE',
      items: [
        { title: 'Résumé IA', url: '/__dashboard_intel', icon: Sparkles },
        { title: 'Alertes Actives', url: '/__dashboard_intel_alerts', icon: Bell, badge: 5, badgeStyle: 'red' },
        { title: 'Agents IA', url: '/__dashboard_intel_agents', icon: Brain, badge: 24, badgeStyle: 'gold' },
        { title: 'Rapports', url: '/__dashboard_rapports', icon: FileBarChart },
        { title: 'Historique', url: '/__dashboard_intel_history', icon: Clock },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: 'Design Guardian', url: '/design-guardian', icon: Shield },
      ],
    },
    {
      key: 'administration',
      label: nav.sectionAdmin || 'ADMINISTRATION',
      items: [
        { title: 'Utilisateurs', url: '/utilisateurs', icon: Users },
        { title: nav.settings || 'Paramètres', url: '/settings', icon: Settings },
        { title: 'Intégrations', url: '/integrations', icon: Plug, subtitle: 'n8n · WhatsApp · GPS' },
        { title: nav.profile || 'Profil', url: '/user_profile', icon: User },
        { title: nav.security || 'Sécurité', url: '/securite', icon: Shield },
        { title: nav.auditLog || 'Journal', url: '/journal', icon: BookOpen },
        { title: nav.approvals || 'Approbations', url: '/approbations', icon: CheckSquare },
        { title: nav.supervisorAudit || 'Audit', url: '/audit-superviseur', icon: Search },
        { title: '🎯 Visite Guidée', url: '/__tour', icon: BookOpen },
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
    try {
      const stored = localStorage.getItem('tbos_sidebar_sections');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure active sections are open
        for (const key of activeSectionKeys) parsed[key] = true;
        return parsed;
      }
    } catch { /* ignore */ }
    const initial = { ...DEFAULT_OPEN };
    for (const key of activeSectionKeys) initial[key] = true;
    return initial;
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('tbos_sidebar_sections', JSON.stringify(next));
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path.startsWith('/__dashboard_')) return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  const handleNav = (url: string) => {
    // Tour trigger
    if (url === '/__tour') {
      window.dispatchEvent(new Event('tbos-start-tour'));
      if (window.innerWidth < 768) onClose();
      return;
    }
    // Intelligence section items → navigate to dashboard with tab state
    if (url === '/__dashboard_intel' || url === '/__dashboard_intel_alerts' || url === '/__dashboard_intel_agents' || url === '/__dashboard_intel_history') {
      navigate('/', { state: { activeTab: 'intelligence' } });
    } else if (url === '/__dashboard_rapports') {
      navigate('/', { state: { activeTab: 'command', scrollTo: 'rapports' } });
    } else {
      navigate(url);
    }
    if (window.innerWidth < 768) onClose();
  };

  const userEmail = user?.email || '';
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Max';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <nav
      aria-label="Navigation principale"
      data-tour="sidebar"
      className={cn(
        'fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        width: 200,
        background: '#0B1120',
        borderRight: '1px solid rgba(212, 168, 67, 0.08)',
        boxShadow: '2px 0 16px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Gold edge highlight */}
      <div className="absolute top-0 left-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, rgba(212,168,67,0.4) 0%, rgba(212,168,67,0.08) 50%, transparent 100%)' }} />

      {/* ── BRAND HEADER ── */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center tbos-sidebar-logo"
            style={{
              background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)',
              boxShadow: '0 4px 16px rgba(212, 168, 67, 0.3), 0 0 24px rgba(212, 168, 67, 0.15)',
            }}
          >
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 14, fontWeight: 700, color: '#0B1120' }}>T</span>
          </div>
          <div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 18, fontWeight: 700, color: '#D4A843', letterSpacing: '0.05em' }}>TBOS</div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 10, fontWeight: 300, letterSpacing: '3px', color: '#9CA3AF', textTransform: 'uppercase' as const }}>SUITE</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SHORTCUT ── */}
      <div className="flex items-center gap-2 mx-3 my-1.5 px-2.5 py-1.5 cursor-default select-none shrink-0" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(212, 168, 67, 0.15)', borderRadius: 6 }}>
        <Search className="flex-shrink-0" style={{ color: '#9CA3AF' }} size={14} strokeWidth={1.5} />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#9CA3AF' }}>Recherche...</span>
        <span className="ml-auto" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, background: 'rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 4px', color: '#9CA3AF' }}>⌘K</span>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pt-1 pb-2 tbos-sidebar-scroll" style={{ scrollbarWidth: 'thin' }}>
        {filteredSections.map((section, si) => {
          const isOpen = openSections[section.key] ?? false;
          const sectionHasActive = section.items.some(item => isActive(item.url));

          return (
            <div key={section.key}>
              {/* Divider between sections */}
              {si > 0 && (
                <div style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.06)', marginTop: 8, marginBottom: 8, marginLeft: 16, marginRight: 16 }} />
              )}

              {/* Section header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="flex items-center gap-1.5 w-full px-4 group cursor-pointer"
                style={{ paddingTop: 4, paddingBottom: 6 }}
              >
                <ChevronRight
                  size={10}
                  className="flex-shrink-0 group-hover:text-[#D4A843]"
                  style={{
                    color: '#9CA3AF',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease, color 200ms ease',
                  }}
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
                  maxHeight: isOpen ? `${section.items.length * 42 + 8}px` : '0px',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div>
                  {section.items.map((item) => {
                    const active = isActive(item.url);
                    const badgeColors = item.badgeStyle === 'gold'
                      ? { bg: 'rgba(212, 168, 67, 0.2)', color: '#D4A843' }
                      : item.badgeStyle === 'green'
                      ? { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }
                      : { bg: '#EF4444', color: '#FFFFFF' };
                    return (
                      <button
                        key={item.url}
                        onClick={() => handleNav(item.url)}
                        className="relative w-full flex items-center text-left transition-all duration-200 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A843]"
                        style={{
                          padding: '8px 12px 8px 20px',
                          marginBottom: 2,
                          lineHeight: 1.4,
                          borderRadius: 0,
                          ...(active ? {
                            background: 'rgba(212, 168, 67, 0.1)',
                            borderLeft: '3px solid #D4A843',
                            boxShadow: 'inset 3px 0 8px rgba(212, 168, 67, 0.15)',
                            paddingLeft: 17,
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
                          className="flex-shrink-0 transition-colors duration-200"
                          size={16}
                          strokeWidth={1.5}
                          style={{ color: active ? '#D4A843' : '#9CA3AF', marginRight: 10 }}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className="block truncate transition-colors duration-200"
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              fontSize: 13,
                              fontWeight: active ? 600 : 400,
                              color: active ? '#D4A843' : '#9CA3AF',
                            }}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 9, color: '#9CA3AF', display: 'block', marginTop: 1 }}>
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        {item.badge != null && item.badge !== '●' && (
                          <span
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              fontSize: 10,
                              fontWeight: 600,
                              background: badgeColors.bg,
                              color: badgeColors.color,
                              borderRadius: 10,
                              minWidth: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 6px',
                              flexShrink: 0,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.badge === '●' && (
                          <span className="flex items-center justify-center" style={{ width: 20, height: 20, flexShrink: 0 }}>
                            <span className="rounded-full animate-pulse" style={{ width: 8, height: 8, background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
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
      <div className="shrink-0" style={{ borderTop: '1px solid rgba(212, 168, 67, 0.08)', background: 'rgba(0, 0, 0, 0.15)' }}>
        <div
          className="mx-3 my-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            background: 'transparent',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: '#D4A843',
                  color: '#0F1629',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </div>
               <div
                 className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                 style={{ background: '#22C55E', border: '2px solid #0B1120' }}
               />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: '#FFFFFF', fontWeight: 600 }} className="truncate">{userName} Talmi</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9CA3AF' }} className="truncate">Directeur Général</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); signOut(); }}
              className="p-1 rounded-md transition-colors duration-200 flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A843]"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SYSTEM HEALTH BAR ── */}
      <SystemHealthBar />

      {/* ── BRAND WATERMARK ── */}
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 8, color: 'rgba(156,163,175,0.2)', textAlign: 'center', padding: 8 }}>
        TBOS v2.0 · Atlas Concrete Morocco
      </div>
    </nav>
  );
}
