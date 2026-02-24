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
  const { t, isRTL } = useI18n();

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
        { title: nav.supervisorAudit || 'Audit Superviseur', url: '/audit-superviseur', icon: Search },
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
    // Close on mobile
    if (window.innerWidth < 1024) onClose();
  };

  // User display
  const userEmail = user?.email || '';
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Utilisateur';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();
  const roleLabel = (role || 'user').toUpperCase();

  // Tier-specific font sizes
  const tierFontSize = {
    command: 'text-[13.5px]',
    ops: 'text-[12.5px]',
    finance: 'text-[12px]',
    admin: 'text-[11.5px]',
  };

  const tierIconSize = {
    command: 'w-4 h-4',
    ops: 'w-[15px] h-[15px]',
    finance: 'w-[14px] h-[14px]',
    admin: 'w-[13px] h-[13px]',
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 w-[240px] z-40 flex flex-col transition-transform duration-300 ease-out',
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

      {/* Aggregate texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.006,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='30' r='8' fill='white' opacity='0.3'/%3E%3Ccircle cx='70' cy='15' r='5' fill='white' opacity='0.2'/%3E%3Ccircle cx='45' cy='65' r='10' fill='white' opacity='0.25'/%3E%3Ccircle cx='85' cy='75' r='6' fill='white' opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }}
      />

      {/* ─── Logo ─── */}
      <div className="px-6 pt-7 pb-5 shrink-0 relative z-[1]">
        <div className="relative inline-block">
          <div className="absolute inset-0 blur-xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.5) 0%, transparent 70%)' }} />
          <div className="relative text-[14px] font-semibold tracking-[0.3em] uppercase" style={{ color: '#E8B84B' }}>
            TBOS
          </div>
        </div>
        <div className="text-[9px] tracking-[0.4em] uppercase text-slate-600 mt-0.5">Suite</div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-1 scrollbar-hide relative z-[1]">
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section header */}
            <div className="px-6 pt-6 pb-1.5">
              <span className="text-[8px] font-medium uppercase tracking-[0.35em] text-slate-700">
                {section.label}
              </span>
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
                      'relative w-full flex items-center gap-3 px-6 py-[7px] transition-all duration-200 cursor-pointer text-left',
                      tierFontSize[section.tier],
                      active
                        ? 'text-white/90 font-medium'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                    )}
                  >
                    {/* Active gold left bar */}
                    {active && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full"
                        style={{ background: 'linear-gradient(180deg, #E8B84B, rgba(232,184,75,0.3))' }}
                      />
                    )}
                    {/* Active tint background */}
                    {active && (
                      <span
                        className="absolute inset-0 rounded-r-lg pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, rgba(232,184,75,0.06), transparent)' }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        tierIconSize[section.tier],
                        'shrink-0 relative z-[1]',
                        active ? 'opacity-70' : 'opacity-30'
                      )}
                    />
                    <span className="truncate relative z-[1]">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Casablanca Skyline ─── */}
      <div className="mt-auto px-4 pb-1 pointer-events-none select-none relative z-[1]">
        <svg width="100%" height="50" viewBox="0 0 200 50" preserveAspectRatio="xMidYMax meet" style={{ opacity: 0.08 }}>
          {/* Hassan II Mosque minaret */}
          <rect x="45" y="2" width="6" height="45" fill="rgba(232,184,75,0.7)" />
          <rect x="43" y="0" width="10" height="4" rx="1" fill="rgba(232,184,75,0.6)" />
          <polygon points="48,0 46,0 48,-3 50,0" fill="rgba(232,184,75,0.5)" />
          <rect x="44" y="10" width="8" height="12" rx="1" fill="rgba(232,184,75,0.5)" />
          {/* Modern buildings */}
          <rect x="60" y="15" width="14" height="32" rx="1" fill="rgba(232,184,75,0.5)" />
          <rect x="78" y="20" width="10" height="27" rx="1" fill="rgba(232,184,75,0.4)" />
          <rect x="92" y="12" width="12" height="35" rx="1" fill="rgba(232,184,75,0.45)" />
          <rect x="108" y="18" width="16" height="29" rx="1" fill="rgba(232,184,75,0.5)" />
          <rect x="128" y="22" width="10" height="25" rx="1" fill="rgba(232,184,75,0.35)" />
          {/* Twin towers */}
          <rect x="142" y="8" width="8" height="39" rx="1" fill="rgba(232,184,75,0.5)" />
          <rect x="153" y="10" width="8" height="37" rx="1" fill="rgba(232,184,75,0.45)" />
          <line x1="150" y1="6" x2="153" y2="6" stroke="rgba(232,184,75,0.3)" strokeWidth="0.5" />
          {/* Smaller buildings */}
          <rect x="20" y="25" width="12" height="22" rx="1" fill="rgba(232,184,75,0.35)" />
          <rect x="165" y="28" width="15" height="19" rx="1" fill="rgba(232,184,75,0.3)" />
          <rect x="5" y="30" width="10" height="17" rx="1" fill="rgba(232,184,75,0.25)" />
          {/* Ground */}
          <line x1="0" y1="47" x2="200" y2="47" stroke="rgba(232,184,75,0.3)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ─── User Profile Footer ─── */}
      <div className="shrink-0 relative z-[1]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="px-5 py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.08))' }}
          >
            <span className="text-[11px] font-medium" style={{ color: 'rgba(234,179,8,0.8)' }}>{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/70 truncate">{userName}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600">{roleLabel}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-400 hover:bg-white/[0.03] transition-all"
            title={nav.logout || 'Logout'}
          >
            <LogOut className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
