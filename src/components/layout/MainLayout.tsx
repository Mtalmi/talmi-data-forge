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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar with Global Search and Notifications */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile: Hamburger + Logo */}
            {showMobileNav && (
              <div className="flex items-center gap-3">
                <MobileSidebar />
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">TBOS</span>
                </div>
              </div>
            )}
            
            {/* Search - Hide on mobile, show condensed on tablet */}
            <div className={showMobileNav ? "hidden sm:flex flex-1" : "flex-1"}>
              <GlobalSearch />
            </div>
            
            <NotificationCenter />
          </div>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
