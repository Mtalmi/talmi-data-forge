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
    <div
      className="relative flex h-screen w-full overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #11182E, #162036)' }}
    >
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
        <div
          className={`relative z-10 flex flex-col h-screen flex-1 min-w-0 overflow-y-auto overflow-x-hidden max-w-full transition-[margin] duration-300 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-0'}`}
          style={{ background: 'transparent' }}
        >
        {/* Preview Mode Banner */}
        {previewRole && (
          <RolePreviewBanner
            previewRole={previewRole}
            onExit={() => setPreviewRole(null)}
          />
        )}

        {/* Top Bar with hamburger */}
        <div className="tbos-top-navbar-shell flex items-center shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all z-20 lg:hidden"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <TopNavBar
              previewRole={previewRole}
              onPreviewRoleChange={setPreviewRole}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 overflow-x-hidden scroll-smooth ${previewRole ? 'pt-2' : ''}`}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 mobile-content safe-area-bottom overflow-x-hidden w-full max-w-full min-w-0">
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
