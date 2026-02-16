import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { AmbientGlow } from './AmbientGlow';
import { QuickActionFAB } from './QuickActionFAB';
import { RolePreviewBanner } from './RolePreviewSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
import { AppSidebar } from './AppSidebar';
import { PageTransition } from './PageTransition';
import { CommandPalette } from '@/components/command/CommandPalette';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import noiseTexture from '@/assets/noise-texture.png';

interface MainLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export default function MainLayout({ children, hideBottomNav = false }: MainLayoutProps) {
  const { isMobile, isTablet } = useDeviceType();
  const showMobileNav = isMobile;
  const { previewRole, setPreviewRole } = usePreviewRole();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="relative min-h-[100dvh] bg-background overflow-hidden flex w-full">
        {/* Ambient Glow Background */}
        <AmbientGlow intensity="subtle" />

        {/* Noise Grain Overlay — premium depth */}
        <div
          className="fixed inset-0 pointer-events-none z-[1] opacity-[0.035] dark:opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url(${noiseTexture})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
          }}
        />

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
          
          {/* Main Content Area with Page Transitions */}
          <main className={`flex-1 overflow-y-auto scroll-smooth ${previewRole ? 'pt-2' : ''}`}>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1900px] mx-auto mobile-content safe-area-bottom">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>

          {/* Quick Action FAB */}
          <QuickActionFAB />

          {/* Command Palette (Cmd+K) */}
          <CommandPalette />

          {/* PWA Components */}
          <OfflineIndicator />
          <PWAInstallPrompt />

          {/* Mobile Bottom Navigation */}
          {!hideBottomNav && showMobileNav && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
