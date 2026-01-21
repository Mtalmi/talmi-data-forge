import { NavLink, useLocation } from 'react-router-dom';
import { forwardRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePendingBLCount } from '@/hooks/usePendingBLCount';
import {
  LayoutDashboard,
  FlaskConical,
  DollarSign,
  Users,
  Truck,
  LogOut,
  Shield,
  Building2,
  ChevronRight,
  Bell,
  CheckSquare,
  AlertTriangle,
  Factory,
  Warehouse,
  Route,
  Receipt,
  CalendarClock,
  ShoppingCart,
  BarChart3,
  PackageSearch,
  Clock,
  MapPin,
  Menu,
  X,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useDeviceType } from '@/hooks/useDeviceType';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon, label, badge, onClick }, ref) => {
    const location = useLocation();
    const toPath = to.split('?')[0];
    const isActive = location.pathname === toPath;

    return (
      <NavLink
        ref={ref}
        to={to}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'min-h-[44px]', // Touch-friendly minimum height
          isActive && 'bg-primary/10 text-primary border-l-2 border-primary -ml-[2px] pl-[14px]'
        )}
      >
        <span className={cn('flex-shrink-0', isActive && 'text-primary')}>{icon}</span>
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="flex-shrink-0 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold px-1.5">
            {badge}
          </span>
        )}
        {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
      </NavLink>
    );
  }
);

NavItem.displayName = 'NavItem';

interface SidebarContentProps {
  onNavClick?: () => void;
  previewRole?: string | null;
  pendingBLCount?: number;
}

function SidebarContent({ onNavClick, previewRole, pendingBLCount = 0 }: SidebarContentProps) {
  const { user, role: actualRole, signOut, isCeo: actualIsCeo } = useAuth();

  // Use preview role if set, otherwise use actual role
  const effectiveRole = previewRole || actualRole;
  
  // In preview mode, determine permissions based on the previewed role
  const isCeo = previewRole ? previewRole === 'ceo' : actualIsCeo;

  // Define STRICT role-based navigation - MINIMAL access only
  const roleNavConfig: Record<string, string[]> = {
    // CEO - unrestricted access
    ceo: ['/', '/planning', '/chauffeur', '/bons', '/production', '/logistique', '/formules', '/ventes', 
          '/clients', '/stocks', '/laboratoire', '/depenses', '/fournisseurs', '/prestataires', 
          '/paiements', '/rapprochement', '/pointage', '/prix', '/maintenance', '/rapports', '/approbations', '/alertes', '/audit-superviseur', '/users'],
    
    // Superviseur (Karim) - FULL access like CEO (all changes are audited)
    superviseur: ['/', '/planning', '/chauffeur', '/bons', '/production', '/logistique', '/formules', '/ventes', 
          '/clients', '/stocks', '/laboratoire', '/depenses', '/fournisseurs', '/prestataires', 
          '/paiements', '/rapprochement', '/pointage', '/prix', '/maintenance', '/rapports', '/approbations', '/alertes'],
    
    // Directeur Opérations - oversight of operations only
    directeur_operations: ['/', '/planning', '/bons', '/production', '/logistique', '/stocks', '/pointage', '/maintenance'],
    
    // Responsable Technique - lab & quality ONLY
    responsable_technique: ['/laboratoire', '/formules'],
    
    // Agent Administratif - billing & client admin ONLY
    agent_administratif: ['/bons', '/clients', '/depenses'],
    
    // Centraliste - plant operations (production + stocks + maintenance)
    centraliste: ['/production', '/stocks', '/maintenance'],
    
    // Chauffeur - driver view ONLY
    chauffeur: ['/chauffeur'],
    
    // Commercial - sales ONLY
    commercial: ['/ventes', '/clients'],
    
    // Operator - production ONLY
    operator: ['/production', '/stocks'],
    
    // Accounting - finance ONLY
    accounting: ['/paiements', '/rapprochement', '/depenses'],
  };

  // Get allowed routes for effective role
  const allowedRoutes = roleNavConfig[effectiveRole || ''] || ['/'];
  const canAccess = (route: string) => allowedRoutes.includes(route);

  // CEO section visibility
  const showCeoSection = isCeo || effectiveRole === 'superviseur';

  const planningHref = pendingBLCount > 0 ? '/planning?focus=pending' : '/planning';

  const getRoleBadge = () => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      ceo: { label: 'CEO', className: 'bg-primary/20 text-primary' },
      operator: { label: 'Opérateur', className: 'bg-accent/20 text-accent' },
      accounting: { label: 'Comptabilité', className: 'bg-success/20 text-success' },
      commercial: { label: 'Commercial', className: 'bg-warning/20 text-warning' },
      superviseur: { label: 'Superviseur', className: 'bg-primary/20 text-primary' },
      responsable_technique: { label: 'Resp. Technique', className: 'bg-purple-500/20 text-purple-500' },
      directeur_operations: { label: 'Dir. Opérations', className: 'bg-orange-500/20 text-orange-500' },
      agent_administratif: { label: 'Agent Admin', className: 'bg-teal-500/20 text-teal-500' },
      centraliste: { label: 'Centraliste', className: 'bg-pink-500/20 text-pink-500' },
      chauffeur: { label: 'Chauffeur', className: 'bg-emerald-500/20 text-emerald-500' },
    };
    return effectiveRole ? roleConfig[effectiveRole] : { label: 'Non assigné', className: 'bg-muted text-muted-foreground' };
  };

  const roleBadge = getRoleBadge();
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">TBOS</h1>
          <p className="text-xs text-muted-foreground">Talmi Beton OS</p>
        </div>
      </div>

      {/* Navigation - Organized by WORKFLOW SEQUENCE */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {canAccess('/') && (
          <NavItem to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Tableau de bord" onClick={onNavClick} />
        )}
        
        {/* STEP 1: COMMERCIAL - Quote & Order Entry */}
        {(canAccess('/ventes') || canAccess('/clients')) && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Commercial
                </p>
              </div>
            </div>
            {canAccess('/ventes') && <NavItem to="/ventes" icon={<ShoppingCart className="h-5 w-5" />} label="Ventes (Devis → BC)" onClick={onNavClick} />}
            {canAccess('/clients') && <NavItem to="/clients" icon={<Users className="h-5 w-5" />} label="Clients" onClick={onNavClick} />}
          </>
        )}

        {/* STEP 2: PLANNING & OPERATIONS */}
        {(canAccess('/planning') || canAccess('/production') || canAccess('/logistique') || canAccess('/chauffeur')) && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Opérations
                </p>
              </div>
            </div>
            {canAccess('/planning') && <NavItem to={planningHref} icon={<CalendarClock className="h-5 w-5" />} label="Planning" badge={pendingBLCount} onClick={onNavClick} />}
            {canAccess('/production') && <NavItem to="/production" icon={<Factory className="h-5 w-5" />} label="Centre Production" onClick={onNavClick} />}
            {canAccess('/logistique') && <NavItem to="/logistique" icon={<Route className="h-5 w-5" />} label="Logistique" onClick={onNavClick} />}
            {canAccess('/chauffeur') && <NavItem to="/chauffeur" icon={<Truck className="h-5 w-5" />} label="Vue Chauffeur" onClick={onNavClick} />}
          </>
        )}

        {/* STEP 3: FACTURATION & FINANCE */}
        {(canAccess('/bons') || canAccess('/paiements') || canAccess('/rapprochement') || canAccess('/depenses')) && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Facturation
                </p>
              </div>
            </div>
            {canAccess('/bons') && <NavItem to="/bons" icon={<Receipt className="h-5 w-5" />} label="Archive BL & Factures" onClick={onNavClick} />}
            {canAccess('/paiements') && <NavItem to="/paiements" icon={<DollarSign className="h-5 w-5" />} label="Suivi Paiements" onClick={onNavClick} />}
            {canAccess('/rapprochement') && <NavItem to="/rapprochement" icon={<Building2 className="h-5 w-5" />} label="Rapprochement" onClick={onNavClick} />}
            {canAccess('/depenses') && <NavItem to="/depenses" icon={<Receipt className="h-5 w-5" />} label="Dépenses" onClick={onNavClick} />}
          </>
        )}

        {/* SUPPORT: Stocks, Formules, Lab, Maintenance */}
        {(canAccess('/stocks') || canAccess('/formules') || canAccess('/laboratoire') || canAccess('/maintenance') || canAccess('/prix') || canAccess('/fournisseurs') || canAccess('/prestataires') || canAccess('/pointage')) && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Support & Ressources
              </p>
            </div>
            {canAccess('/stocks') && <NavItem to="/stocks" icon={<Warehouse className="h-5 w-5" />} label="Stocks (Silos)" onClick={onNavClick} />}
            {canAccess('/formules') && <NavItem to="/formules" icon={<FlaskConical className="h-5 w-5" />} label="Formules Béton" onClick={onNavClick} />}
            {canAccess('/laboratoire') && <NavItem to="/laboratoire" icon={<FlaskConical className="h-5 w-5" />} label="Laboratoire" onClick={onNavClick} />}
            {canAccess('/maintenance') && <NavItem to="/maintenance" icon={<Wrench className="h-5 w-5" />} label="Maintenance" onClick={onNavClick} />}
            {canAccess('/fournisseurs') && <NavItem to="/fournisseurs" icon={<PackageSearch className="h-5 w-5" />} label="Fournisseurs" onClick={onNavClick} />}
            {canAccess('/prestataires') && <NavItem to="/prestataires" icon={<MapPin className="h-5 w-5" />} label="Transport & Zones" onClick={onNavClick} />}
            {canAccess('/prix') && <NavItem to="/prix" icon={<DollarSign className="h-5 w-5" />} label="Prix d'Achat" onClick={onNavClick} />}
            {canAccess('/pointage') && <NavItem to="/pointage" icon={<Clock className="h-5 w-5" />} label="Pointage" onClick={onNavClick} />}
          </>
        )}
        
        {/* CEO CONTROL PANEL */}
        {showCeoSection && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contrôle CEO
              </p>
            </div>
            <NavItem to="/rapports" icon={<BarChart3 className="h-5 w-5" />} label="Rapports & BI" onClick={onNavClick} />
            <NavItem to="/approbations" icon={<CheckSquare className="h-5 w-5" />} label="Approbations" onClick={onNavClick} />
            <NavItem to="/alertes" icon={<AlertTriangle className="h-5 w-5" />} label="Alertes" onClick={onNavClick} />
            {isCeo && <NavItem to="/audit-superviseur" icon={<Shield className="h-5 w-5" />} label="Audit Superviseur" onClick={onNavClick} />}
            {isCeo && <NavItem to="/users" icon={<Users className="h-5 w-5" />} label="Utilisateurs" onClick={onNavClick} />}
          </>
        )}
      </nav>

      <Separator className="mx-3" />

      {/* User Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1', roleBadge.className)}>
              {roleBadge.label}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground min-h-[44px]"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </>
  );
}

// Mobile Sidebar with Sheet
export function MobileSidebar({ previewRole }: { previewRole?: string | null }) {
  const [open, setOpen] = useState(false);
  const { count: pendingBLCount } = usePendingBLCount();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden min-h-[44px] min-w-[44px] relative"
        >
          <Menu className="h-6 w-6" />
          {pendingBLCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold px-1">
              {pendingBLCount}
            </span>
          )}
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-sidebar">
        <div className="flex flex-col h-full">
          <SidebarContent onNavClick={() => setOpen(false)} previewRole={previewRole} pendingBLCount={pendingBLCount} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar
export default function Sidebar({ previewRole }: { previewRole?: string | null }) {
  const { isMobile, isTablet } = useDeviceType();
  const { count: pendingBLCount } = usePendingBLCount();

  // Hide sidebar on mobile/tablet - use MobileSidebar instead
  if (isMobile || isTablet) {
    return null;
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border">
      <SidebarContent previewRole={previewRole} pendingBLCount={pendingBLCount} />
    </aside>
  );
}
