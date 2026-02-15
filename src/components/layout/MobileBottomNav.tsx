import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Truck, 
  FileText, 
  MoreHorizontal,
  Package,
  Users,
  Factory,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const PRIMARY_NAV_KEYS: (NavItem & { labelKey: string })[] = [
  { path: '/', label: '', labelKey: 'nav.home', icon: LayoutDashboard },
  { path: '/planning', label: '', labelKey: 'nav.planning', icon: CalendarClock },
  { path: '/logistique', label: '', labelKey: 'nav.logistics', icon: Truck },
];

const MORE_NAV_KEYS: (NavItem & { labelKey: string })[] = [
  { path: '/ventes', label: '', labelKey: 'nav.sales', icon: Receipt },
  { path: '/production', label: '', labelKey: 'nav.production', icon: Factory },
  { path: '/stocks', label: '', labelKey: 'nav.stocks', icon: Package },
  { path: '/clients', label: '', labelKey: 'nav.clients', icon: Users },
  { path: '/bons', label: '', labelKey: 'nav.blArchive', icon: FileText },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if current path is in "more" items
  const isMoreActive = MORE_NAV_KEYS.some(item => location.pathname === item.path);

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Navigation principale">
      <div className="mobile-bottom-nav-container">
        {PRIMARY_NAV_KEYS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "mobile-nav-item press-down",
                isActive && "mobile-nav-item-active"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="mobile-nav-icon" />
              <span className="mobile-nav-label">{t(item.labelKey)}</span>
              {isActive && <div className="mobile-nav-indicator" />}
            </NavLink>
          );
        })}

        {/* More Menu */}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "mobile-nav-item",
                isMoreActive && "mobile-nav-item-active"
              )}
            >
              <MoreHorizontal className="mobile-nav-icon" />
              <span className="mobile-nav-label">{t('nav.more')}</span>
              {isMoreActive && <div className="mobile-nav-indicator" />}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-2 glass-premium mb-2" 
            side="top" 
            align="end"
            sideOffset={8}
          >
            <div className="grid gap-1">
              {MORE_NAV_KEYS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      "min-h-[48px]",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
