import React from 'react';
import { DevisTable } from './DevisTable';
import { DevisCardMobile } from './DevisCardMobile';
import { Devis } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpirationInfo {
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

interface DevisTableResponsiveProps {
  devisList: Devis[];
  loading: boolean;
  onConvert: (devis: Devis) => void;
  onRowClick?: (devis: Devis) => void;
  getExpirationInfo?: (devis: Devis) => ExpirationInfo;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuickSend?: (devis: Devis) => void;
  onRefresh?: () => void;
  onStatusChange?: (devis: Devis, newStatus: string) => void;
}

export function DevisTableResponsive(props: DevisTableResponsiveProps) {
  const { canApproveDevis } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (props.loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="quote-card-mobile">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile view: Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {props.devisList.length === 0 ? (
          <div className="empty-state-mobile">
            <div className="icon">📋</div>
            <div className="title">Aucun devis</div>
            <div className="description">
              Aucun devis ne correspond aux critères de recherche.
            </div>
          </div>
        ) : (
          props.devisList.map((devis) => (
            <DevisCardMobile
              key={devis.devis_id}
              devis={devis}
              onConvert={props.onConvert}
              onClick={props.onRowClick}
              getExpirationInfo={props.getExpirationInfo}
              onStatusChange={props.onStatusChange}
              onQuickSend={props.onQuickSend}
              canApproveDevis={canApproveDevis}
            />
          ))
        )}
      </div>
    );
  }

  // Desktop view: Table layout
  return <DevisTable {...props} />;
}
