import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Package,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  hideForRoles?: string[];
}

const mainNavItems: NavItem[] = [
  {
    path: '/',
    label: 'Sanctum',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: '/ventes',
    label: 'Ventes',
    icon: <ShoppingCart className="h-5 w-5" />,
    hideForRoles: ['centraliste'],
  },
  {
    path: '/production',
    label: 'Production',
    icon: <Factory className="h-5 w-5" />,
  },
  {
    path: '/stocks',
    label: 'Stocks',
    icon: <Package className="h-5 w-5" />,
    hideForRoles: ['centraliste'],
  },
];

const secondaryNavItems: NavItem[] = [
  {
    path: '/planning',
    label: 'Planning',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    path: '/clients',
    label: 'Clients',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    path: '/formules',
    label: 'Formules',
    icon: <Factory className="h-5 w-5" />,
  },
  {
    path: '/rapports',
    label: 'Rapports',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { role, isCentraliste } = useAuth();

  const filteredNavItems = mainNavItems.filter(item => {
    if (item.hideForRoles?.includes(role || '')) {
      return false;
    }
    return true;
  });

  // Show only first 4 items in bottom nav, rest go to "More" sheet
  const bottomNavItems = filteredNavItems.slice(0, 4);

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">Plus</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {secondaryNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export function MobileSidebar() {
  const location = useLocation();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const allNavItems = [...mainNavItems, ...secondaryNavItems].filter(item => {
    if (item.hideForRoles?.includes(role || '')) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Hamburger Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="mobile-nav-toggle"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn("mobile-sidebar", !isOpen && "closed")}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-primary">TBOS</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-accent"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {allNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
