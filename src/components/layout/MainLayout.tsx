import { ReactNode } from 'react';
import { TopNavBar } from './TopNavBar';
import { AmbientGlow } from './AmbientGlow';
import { QuickActionFAB } from './QuickActionFAB';
import { RolePreviewBanner } from './RolePreviewSwitcher';
import { MobileBottomNav } from './MobileBottomNav';
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
    <div className="relative min-h-[100dvh] bg-background overflow-hidden">
      {/* Ambient Glow Background */}
      <AmbientGlow intensity="subtle" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Preview Mode Banner */}
        {previewRole && (
          <RolePreviewBanner 
            previewRole={previewRole} 
            onExit={() => setPreviewRole(null)} 
          />
        )}
        
        {/* Sleek Top Navigation */}
        <TopNavBar 
          previewRole={previewRole}
          onPreviewRoleChange={setPreviewRole}
        />
        
        {/* Main Content Area - Maximum breathing room */}
        <main className={`flex-1 overflow-y-auto ${previewRole ? 'pt-2' : ''}`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto mobile-content safe-area-bottom">
            {children}
          </div>
        </main>

        {/* Quick Action FAB for employees */}
        <QuickActionFAB />

        {/* Mobile Bottom Navigation */}
        {!hideBottomNav && showMobileNav && <MobileBottomNav />}
      </div>
    </div>
  );
}
