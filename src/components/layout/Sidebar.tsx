import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  FlaskConical,
  DollarSign,
  Users,
  Truck,
  Settings,
  LogOut,
  Shield,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function NavItem({ to, icon, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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

export default function Sidebar() {
  const { user, role, signOut, isCeo } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'ceo':
        return { label: 'CEO', className: 'bg-primary/20 text-primary' };
      case 'operator':
        return { label: 'Opérateur', className: 'bg-accent/20 text-accent' };
      case 'accounting':
        return { label: 'Comptabilité', className: 'bg-success/20 text-success' };
      case 'commercial':
        return { label: 'Commercial', className: 'bg-warning/20 text-warning' };
      default:
        return { label: 'Non assigné', className: 'bg-muted text-muted-foreground' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <aside className="flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Tableau de bord" />
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Production
          </p>
        </div>
        <NavItem to="/bons" icon={<Truck className="h-5 w-5" />} label="Bons de Livraison" />
        <NavItem to="/formules" icon={<FlaskConical className="h-5 w-5" />} label="Formules Béton" />
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gestion
          </p>
        </div>
        <NavItem to="/clients" icon={<Users className="h-5 w-5" />} label="Clients" />
        <NavItem to="/prix" icon={<DollarSign className="h-5 w-5" />} label="Prix d'Achat" />
        
        {isCeo && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </p>
            </div>
            <NavItem to="/users" icon={<Shield className="h-5 w-5" />} label="Utilisateurs" />
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
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
