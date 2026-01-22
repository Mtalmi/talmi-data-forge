import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PendingBcWidgetProps {
  onNavigateToVentes?: () => void;
  compact?: boolean;
}

export function PendingBcWidget({ onNavigateToVentes, compact = false }: PendingBcWidgetProps) {
  const { canValidateBcPrice } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [emergencyCount, setEmergencyCount] = useState(0);

  useEffect(() => {
    if (!canValidateBcPrice) return;

    const fetchPendingCount = async () => {
      const { data, error } = await supabase
        .from('bons_commande')
        .select('id, notes')
        .eq('statut', 'en_attente_validation');

      if (!error && data) {
        setPendingCount(data.length);
        setEmergencyCount(data.filter(bc => bc.notes?.includes('[URGENCE/EMERGENCY')).length);
      }
    };

    fetchPendingCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pending-bc-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bons_commande',
      }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canValidateBcPrice]);

  if (!canValidateBcPrice || pendingCount === 0) {
    return null;
  }

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1",
          emergencyCount > 0 
            ? "bg-red-500/10 text-red-600 border-red-500/30 animate-pulse" 
            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
        )}
      >
        <Clock className="h-3 w-3" />
        {pendingCount} BC à valider
        {emergencyCount > 0 && (
          <span className="text-red-600">({emergencyCount} urgence)</span>
        )}
      </Badge>
    );
  }

  return (
    <Card className={cn(
      "border-2",
      emergencyCount > 0 
        ? "border-red-500/50 bg-red-500/5" 
        : "border-amber-500/50 bg-amber-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              emergencyCount > 0 ? "bg-red-500/20" : "bg-amber-500/20"
            )}>
              {emergencyCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">BC en Attente Validation</p>
              <p className="text-2xl font-bold">
                {pendingCount}
                {emergencyCount > 0 && (
                  <span className="text-sm text-red-600 ml-2">
                    dont {emergencyCount} urgence(s)
                  </span>
                )}
              </p>
            </div>
          </div>
          {onNavigateToVentes && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNavigateToVentes}
              className="gap-1"
            >
              Voir
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
