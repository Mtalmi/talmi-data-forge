import React from 'react';
import { BcTable } from './BcTable';
import { BcCardMobile } from './BcCardMobile';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface BcTableResponsiveProps {
  bcList: BonCommande[];
  loading: boolean;
  onRowClick?: (bc: BonCommande) => void;
  onCreateBL?: (bc: BonCommande) => void;
  onGenerateInvoice?: (bc: BonCommande) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRefresh?: () => void;
}

export function BcTableResponsive(props: BcTableResponsiveProps) {
  const { canCreateBons, canGenerateInvoice } = useAuth();
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
        {props.bcList.length === 0 ? (
          <div className="empty-state-mobile">
            <div className="icon">📦</div>
            <div className="title">Aucun bon de commande</div>
            <div className="description">
              Aucun BC ne correspond aux critères de recherche.
            </div>
          </div>
        ) : (
          props.bcList.map((bc) => (
            <BcCardMobile
              key={bc.bc_id}
              bc={bc}
              onClick={props.onRowClick}
              onCreateBL={props.onCreateBL}
              onGenerateInvoice={props.onGenerateInvoice}
              canCreateBL={canCreateBons}
              canGenerateInvoice={canGenerateInvoice}
              isEmergency={bc.is_emergency_bc}
            />
          ))
        )}
      </div>
    );
  }

  // Desktop view: Table layout
  return <BcTable {...props} />;
}
