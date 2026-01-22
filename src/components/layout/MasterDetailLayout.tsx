import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/useDeviceType';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MasterDetailLayoutProps {
  masterContent: ReactNode;
  detailContent: ReactNode | null;
  detailTitle?: string;
  onDetailClose: () => void;
  detailOpen: boolean;
  masterWidth?: 'narrow' | 'medium' | 'wide';
}

/**
 * Master-Detail layout for tablet optimization
 * - Mobile: Full screen list, sheet overlay for details
 * - Tablet: Side-by-side split view
 * - Desktop: Side-by-side with wider detail panel
 */
export function MasterDetailLayout({
  masterContent,
  detailContent,
  detailTitle = 'Détails',
  onDetailClose,
  detailOpen,
  masterWidth = 'medium',
}: MasterDetailLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useDeviceType();

  // Master panel width based on prop
  const masterWidthClass = {
    narrow: 'lg:w-[320px] xl:w-[360px]',
    medium: 'lg:w-[400px] xl:w-[450px]',
    wide: 'lg:w-[480px] xl:w-[520px]',
  }[masterWidth];

  // Mobile: Use Sheet for details
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-20">
          {masterContent}
        </div>
        
        <Sheet open={detailOpen} onOpenChange={(open) => !open && onDetailClose()}>
          <SheetContent 
            side="bottom" 
            className="h-[85vh] rounded-t-2xl glass-premium p-0"
          >
            <SheetHeader className="sticky top-0 z-10 p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold">{detailTitle}</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDetailClose}
                  className="min-h-[48px] min-w-[48px] -mr-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {detailContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Tablet & Desktop: Split view
  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Master Panel */}
      <div 
        className={cn(
          "flex-shrink-0 overflow-y-auto border-r border-border/50",
          isTablet ? "w-1/2" : masterWidthClass
        )}
      >
        {masterContent}
      </div>

      {/* Detail Panel */}
      <div 
        className={cn(
          "flex-1 overflow-hidden transition-all duration-300",
          detailOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {detailOpen && detailContent ? (
          <div className="h-full flex flex-col glass-card rounded-xl">
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDetailClose}
                  className="min-h-[44px] min-w-[44px] lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">{detailTitle}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDetailClose}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailContent}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <ChevronLeft className="h-8 w-8" />
              </div>
              <p className="text-sm">Sélectionnez un élément pour voir les détails</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
