import { ReactNode } from 'react';
import Sidebar, { MobileSidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useDeviceType } from '@/hooks/useDeviceType';
import { Building2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isMobile, isTablet } = useDeviceType();
  const showMobileNav = isMobile || isTablet;

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] bg-background overflow-hidden min-w-0">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Bar with Global Search and Notifications */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            {/* Mobile: Hamburger + Logo */}
            {showMobileNav && (
              <div className="flex items-center gap-2 min-w-0">
                <MobileSidebar />
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm truncate">TBOS</span>
                </div>
              </div>
            )}
            
            {/* Search - Hide on mobile, show condensed on tablet */}
            <div className={showMobileNav ? "hidden sm:flex flex-1 min-w-0" : "flex-1 min-w-0"}>
              <GlobalSearch />
            </div>
            
            <NotificationCenter />
          </div>
        </div>
        <div className="p-3 sm:p-4 lg:p-6 min-w-0">{children}</div>
      </main>
    </div>
  );
}
