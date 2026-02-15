import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BatchEntryForm } from './BatchEntryForm';
import { 
  Activity, 
  Plus, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ProductionBatch {
  id: string;
  bl_id: string;
  batch_number: number;
  ciment_theo_kg: number;
  ciment_reel_kg: number;
  sable_theo_kg: number | null;
  sable_reel_kg: number | null;
  gravette_theo_kg: number | null;
  gravette_reel_kg: number | null;
  eau_theo_l: number;
  eau_reel_l: number;
  adjuvant_theo_l: number | null;
  adjuvant_reel_l: number | null;
  variance_ciment_pct: number | null;
  variance_sable_pct: number | null;
  variance_gravette_pct: number | null;
  variance_eau_pct: number | null;
  variance_adjuvant_pct: number | null;
  quality_status: 'pending' | 'ok' | 'warning' | 'critical';
  has_critical_variance: boolean;
  photo_pupitre_url: string;
  entered_by_name: string | null;
  entered_at: string;
  notes: string | null;
}

interface BonProduction {
  bl_id: string;
  client_name?: string;
  formule_designation?: string;
  volume_m3: number;
}

interface LiveProductionFeedProps {
  bons: BonProduction[];
  onBatchAdded?: () => void;
  className?: string;
}

export function LiveProductionFeed({ bons, onBatchAdded, className }: LiveProductionFeedProps) {
  const { t, lang } = useI18n();
  const lp = t.liveProductionFeed;
  const dateLocale = getDateLocale(lang);

  const statusConfig = {
    ok: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: lp.conforme },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: lp.ecartWarning },
    critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: lp.ecartCritical },
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border', label: lp.pending },
  };
  const { isCeo, role } = useAuth();
  const isCentraliste = role === 'centraliste';
  const canAddBatch = isCeo || isCentraliste;
  
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBl, setSelectedBl] = useState<BonProduction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*')
        .order('entered_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBatches((data || []) as ProductionBatch[]);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();

    // Set up realtime subscription
    const channel = supabase
      .channel('production_batches_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_batches',
        },
        () => {
          fetchBatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
    setRefreshing(false);
    toast.success(lp.feedRefreshed);
  };

  const handleAddBatch = (bon: BonProduction) => {
    setSelectedBl(bon);
    setDialogOpen(true);
  };

  const handleBatchSubmitted = () => {
    setDialogOpen(false);
    setSelectedBl(null);
    fetchBatches();
    onBatchAdded?.();
  };

  const getVarianceBadge = (value: number | null, label: string) => {
    if (value === null || value === undefined) return null;
    
    const isWarning = value > 2 && value <= 5;
    const isCritical = value > 5;
    
    if (!isWarning && !isCritical) return null;
    
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono',
        isCritical ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
      )}>
        {label}: +{value.toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{lp.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {lp.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Add Buttons - for Centraliste/CEO */}
        {canAddBatch && bons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bons.slice(0, 5).map((bon) => (
              <Button
                key={bon.bl_id}
                variant="outline"
                size="sm"
                onClick={() => handleAddBatch(bon)}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                <span className="font-mono text-xs">{bon.bl_id}</span>
              </Button>
            ))}
          </div>
        )}

        <Separator />

        {/* Batch List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gauge className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{lp.noBatches}</p>
              {canAddBatch && (
                <p className="text-sm text-muted-foreground mt-1">
                  {lp.selectBlToStart}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const status = statusConfig[batch.quality_status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={batch.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all hover:shadow-md',
                      status.bg,
                      status.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', status.bg)}>
                          <StatusIcon className={cn('h-5 w-5', status.color)} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{batch.bl_id}</span>
                            <Badge variant="outline" className="text-xs">
                              Batch #{batch.batch_number}
                            </Badge>
                            <Badge className={cn('text-xs', status.bg, status.color, 'border-0')}>
                              {status.label}
                            </Badge>
                          </div>
                          
                          {/* Variance indicators */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getVarianceBadge(batch.variance_ciment_pct, lp.cement)}
                            {getVarianceBadge(batch.variance_eau_pct, lp.water)}
                            {getVarianceBadge(batch.variance_sable_pct, lp.sand)}
                            {getVarianceBadge(batch.variance_gravette_pct, lp.gravel)}
                            {getVarianceBadge(batch.variance_adjuvant_pct, lp.adjuvant)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(batch.entered_at), 'HH:mm', { locale: dateLocale })}
                            </span>
                            {batch.entered_by_name && (
                              <span>{lp.byUser} {batch.entered_by_name}</span>
                            )}
                            {batch.photo_pupitre_url && (
                              <a 
                                href={batch.photo_pupitre_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Camera className="h-3 w-3" />
                                {lp.photo}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Mini weight display */}
                      <div className="text-right text-xs font-mono space-y-0.5">
                        <div className={cn(
                          batch.variance_ciment_pct && batch.variance_ciment_pct > 2 ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {lp.cementShort}: {batch.ciment_reel_kg.toFixed(0)}kg
                        </div>
                        <div className={cn(
                          batch.variance_eau_pct && batch.variance_eau_pct > 2 ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {lp.waterShort}: {batch.eau_reel_l.toFixed(0)}L
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Batch Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              {lp.batchEntry}
              {selectedBl && (
                <Badge variant="outline" className="ml-2 font-mono">
                  {selectedBl.bl_id}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBl && (
            <BatchEntryForm
              blId={selectedBl.bl_id}
              volume={selectedBl.volume_m3}
              onSuccess={handleBatchSubmitted}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
