import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { AmbientGlow } from './AmbientGlow';
import { QuickActionFAB } from './QuickActionFAB';
import { RolePreviewBanner } from './RolePreviewSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePreviewRole } from '@/hooks/usePreviewRole';

interface MainLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export default function MainLayout({ children, hideBottomNav = false }: MainLayoutProps) {
  const { isMobile, isTablet } = useDeviceType();
  const showMobileNav = isMobile || isTablet;
  const { previewRole, setPreviewRole } = usePreviewRole();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="relative min-h-[100dvh] bg-background overflow-hidden flex w-full">
        {/* Ambient Glow Background */}
        <AmbientGlow intensity="subtle" />

        {/* Left Sidebar - hidden on mobile (uses bottom nav instead) */}
        {!showMobileNav && <AppSidebar />}

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col min-h-[100dvh] flex-1">
          {/* Preview Mode Banner */}
          {previewRole && (
            <RolePreviewBanner 
              previewRole={previewRole} 
              onExit={() => setPreviewRole(null)} 
            />
          )}
          
          {/* Sleek Top Navigation */}
          <div className="flex items-center">
            {!showMobileNav && (
              <SidebarTrigger className="ml-2 text-muted-foreground hover:text-primary" />
            )}
            <div className="flex-1">
              <TopNavBar 
                previewRole={previewRole}
                onPreviewRoleChange={setPreviewRole}
              />
            </div>
          </div>
          
          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto scroll-smooth ${previewRole ? 'pt-2' : ''}`}>
            <div className="p-3 sm:p-6 lg:p-8 max-w-[1900px] mx-auto mobile-content safe-area-bottom page-enter">
              {children}
            </div>
          </main>

          {/* Quick Action FAB */}
          <QuickActionFAB />

          {/* Mobile Bottom Navigation */}
          {!hideBottomNav && showMobileNav && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
