import { ReactNode, useState, useEffect } from 'react';
import { TopNavBar } from './TopNavBar';
import { QuickActionFAB } from './QuickActionFAB';
import { RolePreviewBanner } from './RolePreviewSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
import { AppSidebar } from './AppSidebar';
import { PageTransition } from './PageTransition';
import { CommandPalette } from '@/components/command/CommandPalette';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { NotificationSettings } from '@/components/pwa/NotificationSettings';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export default function MainLayout({ children, hideBottomNav = false }: MainLayoutProps) {
  const { isMobile } = useDeviceType();
  const showMobileNav = isMobile;
  const { previewRole, setPreviewRole } = usePreviewRole();
  usePushNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close on mobile, auto-open on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="relative min-h-[100dvh] bg-background flex w-full">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content Layer — offset by sidebar width on desktop */}
      <div className={`relative z-10 flex flex-col min-h-[100dvh] flex-1 overflow-x-hidden max-w-full transition-[margin] duration-300 ${sidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-0'}`}>
        {/* Preview Mode Banner */}
        {previewRole && (
          <RolePreviewBanner
            previewRole={previewRole}
            onExit={() => setPreviewRole(null)}
          />
        )}

        {/* Top Bar with hamburger */}
        <div className="flex items-center h-11 shrink-0 border-b border-white/[0.04]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            {sidebarOpen ? <X className="h-4 w-4 lg:hidden" /> : null}
            <Menu className={`h-4 w-4 ${sidebarOpen ? 'hidden lg:block' : ''}`} />
          </button>
          <div className="flex-1">
            <TopNavBar
              previewRole={previewRole}
              onPreviewRoleChange={setPreviewRole}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth ${previewRole ? 'pt-2' : ''}`}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1900px] mx-auto mobile-content safe-area-bottom overflow-x-hidden w-full">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>

        {/* Quick Action FAB */}
        <QuickActionFAB />
        <CommandPalette />
        <OfflineIndicator />
        <PWAInstallPrompt />
        <NotificationSettings />

        {/* Mobile Bottom Navigation */}
        {!hideBottomNav && showMobileNav && <MobileBottomNav />}
      </div>
    </div>
  );
}
