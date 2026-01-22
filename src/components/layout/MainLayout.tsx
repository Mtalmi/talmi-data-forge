import { ReactNode } from 'react';
import Sidebar, { MobileSidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { QuickActionFAB } from './QuickActionFAB';
import { RolePreviewSwitcher, RolePreviewBanner } from './RolePreviewSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileBottomNav } from './MobileBottomNav';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { Building2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export default function MainLayout({ children, hideBottomNav = false }: MainLayoutProps) {
  const { isMobile, isTablet } = useDeviceType();
  const showMobileNav = isMobile || isTablet;
  const { previewRole, setPreviewRole } = usePreviewRole();

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] bg-background overflow-hidden min-w-0">
      {/* Preview Mode Banner */}
      {previewRole && (
        <RolePreviewBanner 
          previewRole={previewRole} 
          onExit={() => setPreviewRole(null)} 
        />
      )}
      
      {/* Desktop Sidebar */}
      <Sidebar previewRole={previewRole} />
      
      <main className={`flex-1 min-w-0 overflow-y-auto ${previewRole ? 'pt-10' : ''}`}>
        {/* Top Bar with Global Search and Notifications */}
        <div id="app-topbar" className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            {/* Mobile: Hamburger + Logo */}
            {showMobileNav && (
              <div className="flex items-center gap-2 min-w-0">
                <MobileSidebar previewRole={previewRole} />
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
            
            {/* Role Preview Switcher (CEO only) */}
            <RolePreviewSwitcher 
              previewRole={previewRole} 
              onPreviewRoleChange={setPreviewRole} 
            />
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <NotificationCenter />
          </div>
        </div>
        <div className="p-3 sm:p-4 lg:p-6 min-w-0 mobile-content">{children}</div>
      </main>

      {/* Quick Action FAB for employees */}
      <QuickActionFAB />

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
}