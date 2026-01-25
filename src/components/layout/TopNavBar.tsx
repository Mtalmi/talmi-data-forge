import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePendingBLCount } from '@/hooks/usePendingBLCount';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { RolePreviewSwitcher } from './RolePreviewSwitcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarClock,
  Factory,
  Warehouse,
  Receipt,
  Shield,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Building2,
  FlaskConical,
  Users,
  Truck,
  DollarSign,
  BarChart3,
  Wrench,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface TopNavBarProps {
  previewRole?: string | null;
  onPreviewRoleChange?: (role: string | null) => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function TopNavBar({ previewRole, onPreviewRoleChange }: TopNavBarProps) {
  const { user, role: actualRole, signOut, isCeo: actualIsCeo } = useAuth();
  const { count: pendingBLCount } = usePendingBLCount();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveRole = previewRole || actualRole;
  const isCeo = previewRole ? previewRole === 'ceo' : actualIsCeo;

  // Role-based access
  const roleNavConfig: Record<string, string[]> = {
    ceo: ['/', '/planning', '/chauffeur', '/bons', '/production', '/logistique', '/formules', '/ventes', 
          '/clients', '/stocks', '/laboratoire', '/depenses', '/depenses-v2', '/fournisseurs', '/prestataires', 
          '/paiements', '/rapprochement', '/pointage', '/prix', '/maintenance', '/rapports', '/journal',
          '/approbations', '/alertes', '/audit-superviseur', '/users', '/securite', '/contracts'],
    superviseur: ['/', '/planning', '/chauffeur', '/bons', '/production', '/logistique', '/formules', '/ventes', 
          '/clients', '/stocks', '/laboratoire', '/depenses', '/depenses-v2', '/fournisseurs', '/prestataires', 
          '/paiements', '/rapprochement', '/pointage', '/prix', '/maintenance', '/rapports', '/journal',
          '/approbations', '/alertes', '/securite', '/contracts'],
    responsable_technique: ['/', '/formules', '/stocks', '/production', '/laboratoire', '/maintenance'],
    directeur_operations: ['/', '/clients', '/ventes', '/planning', '/production', '/logistique', '/stocks', '/pointage', '/maintenance'],
    agent_administratif: ['/', '/ventes', '/clients', '/stocks', '/planning', '/production', '/bons', '/depenses', '/depenses-v2', '/paiements', '/contracts'],
    centraliste: ['/production', '/maintenance', '/formules'],
    chauffeur: ['/chauffeur'],
    commercial: ['/ventes', '/clients'],
    operator: ['/production', '/stocks'],
    accounting: ['/paiements', '/rapprochement', '/depenses', '/depenses-v2', '/journal'],
    auditeur: ['/audit-externe'],
  };

  const allowedRoutes = roleNavConfig[effectiveRole || ''] || ['/'];
  const canAccess = (route: string) => allowedRoutes.includes(route);

  // Main navigation items (visible in top bar)
  const mainNavItems: NavItem[] = [
    { to: '/', label: 'Sanctum', icon: LayoutDashboard },
    { to: '/ventes', label: 'Ventes', icon: ShoppingCart },
    { to: '/planning', label: 'Planning', icon: CalendarClock, badge: pendingBLCount },
    { to: '/production', label: 'Production', icon: Factory },
    { to: '/stocks', label: 'Stocks', icon: Warehouse },
  ].filter(item => canAccess(item.to));

  // Grouped navigation for dropdown
  const navGroups: NavGroup[] = [
    {
      label: 'Facturation',
      items: [
        { to: '/bons', label: 'Archive BL', icon: Receipt },
        { to: '/paiements', label: 'Paiements', icon: DollarSign },
        { to: '/depenses-v2', label: 'Dépenses', icon: Receipt },
        { to: '/contracts', label: 'Contrats', icon: FileText },
      ].filter(item => canAccess(item.to)),
    },
    {
      label: 'Ressources',
      items: [
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/formules', label: 'Formules', icon: FlaskConical },
        { to: '/logistique', label: 'Logistique', icon: Truck },
        { to: '/maintenance', label: 'Maintenance', icon: Wrench },
      ].filter(item => canAccess(item.to)),
    },
    ...(isCeo ? [{
      label: 'Contrôle CEO',
      items: [
        { to: '/rapports', label: 'Rapports', icon: BarChart3 },
        { to: '/securite', label: 'Sécurité', icon: Shield },
        { to: '/users', label: 'Utilisateurs', icon: Users },
      ].filter(item => canAccess(item.to)),
    }] : []),
    {
      label: 'Support',
      items: [
        { to: '/aide', label: 'Manuel Système', icon: HelpCircle },
      ],
    },
  ].filter(group => group.items.length > 0);

  const isActive = (path: string) => location.pathname === path;

  const NavLinkItem = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
        'transition-all duration-300',
        isActive(item.to) ? [
          'text-primary-foreground',
          'bg-gradient-to-r from-primary to-primary/80',
          'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
        ] : [
          'text-muted-foreground',
          'hover:text-foreground',
          'hover:bg-muted/50',
        ]
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass Background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />

      <div className="relative flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">TBOS</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Enterprise Suite</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-2xl bg-muted/30 border border-border/30">
          {mainNavItems.map(item => (
            <NavLinkItem key={item.to} item={item} />
          ))}

          {/* More Dropdown */}
          {navGroups.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium',
                  'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  'transition-all duration-200'
                )}>
                  Plus
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-popover/95 backdrop-blur-xl border-border/50"
              >
                {navGroups.map((group, i) => (
                  <div key={group.label}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.items.map(item => (
                      <DropdownMenuItem key={item.to} asChild>
                        <NavLink to={item.to} className="flex items-center gap-2 cursor-pointer">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:block w-64">
            <GlobalSearch />
          </div>

          <ThemeToggle />
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                  <span className="text-sm font-bold text-primary-foreground">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{effectiveRole?.replace('_', ' ')}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-xl p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold">TBOS</h2>
                      <p className="text-xs text-muted-foreground">Navigation</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {mainNavItems.map(item => (
                    <NavLinkItem key={item.to} item={item} onClick={() => setMobileMenuOpen(false)} />
                  ))}

                  {navGroups.map(group => (
                    <div key={group.label} className="pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        {group.label}
                      </p>
                      {group.items.map(item => (
                        <NavLinkItem key={item.to} item={item} onClick={() => setMobileMenuOpen(false)} />
                      ))}
                    </div>
                  ))}
                </nav>

                {/* Mobile Footer */}
                <div className="p-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
