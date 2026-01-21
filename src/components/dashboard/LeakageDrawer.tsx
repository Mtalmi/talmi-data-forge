import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Loader2,
  Truck,
  DollarSign,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeakageDelivery {
  bl_id: string;
  client_nom: string;
  date_livraison: string;
  volume_m3: number;
  cur_reel: number | null;
  prix_vente_m3: number | null;
  marge_brute_pct: number | null;
  alerte_ecart: boolean | null;
  ecart_marge: number | null;
}

interface LeakageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeakageDrawer({ open, onOpenChange }: LeakageDrawerProps) {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<LeakageDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchLeakageDeliveries();
    }
  }, [open]);

  const fetchLeakageDeliveries = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          date_livraison,
          volume_m3,
          cur_reel,
          prix_vente_m3,
          marge_brute_pct,
          alerte_ecart,
          ecart_marge,
          client_id,
          clients!inner(nom_client)
        `)
        .gte('date_livraison', startOfMonth)
        .or('alerte_ecart.eq.true,marge_brute_pct.lt.15')
        .order('date_livraison', { ascending: false })
        .limit(20);

      if (error) throw error;

      const processed: LeakageDelivery[] = (data || []).map((d: any) => ({
        bl_id: d.bl_id,
        client_nom: d.clients?.nom_client || 'N/A',
        date_livraison: d.date_livraison,
        volume_m3: d.volume_m3 || 0,
        cur_reel: d.cur_reel,
        prix_vente_m3: d.prix_vente_m3,
        marge_brute_pct: d.marge_brute_pct,
        alerte_ecart: d.alerte_ecart,
        ecart_marge: d.ecart_marge,
      }));

      setDeliveries(processed);
    } catch (error) {
      console.error('Error fetching leakage deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats based on margin and ecart_marge
  const totalLeakage = deliveries.length;
  const highRiskCount = deliveries.filter(d => 
    (d.ecart_marge !== null && d.ecart_marge < -10) || 
    (d.marge_brute_pct !== null && d.marge_brute_pct < 10)
  ).length;
  const mediumRiskCount = deliveries.filter(d => 
    ((d.ecart_marge !== null && d.ecart_marge >= -10 && d.ecart_marge < -5) || 
    (d.marge_brute_pct !== null && d.marge_brute_pct >= 10 && d.marge_brute_pct < 15)) &&
    !((d.ecart_marge !== null && d.ecart_marge < -10) || (d.marge_brute_pct !== null && d.marge_brute_pct < 10))
  ).length;
  const lowRiskCount = totalLeakage - highRiskCount - mediumRiskCount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' DH';
  };

  const getRiskLevel = (delivery: LeakageDelivery): 'high' | 'medium' | 'low' => {
    const ecart = delivery.ecart_marge || 0;
    const marge = delivery.marge_brute_pct;
    
    if (ecart < -10 || (marge !== null && marge < 10)) {
      return 'high';
    }
    if (ecart < -5 || (marge !== null && marge < 15)) {
      return 'medium';
    }
    return 'low';
  };

  const handleGoToProduction = () => {
    onOpenChange(false);
    navigate('/production');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Analyse des Fuites
          </DrawerTitle>
          <DrawerDescription>
            Livraisons avec surcoûts ou marges faibles ce mois
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Risk Summary */}
              <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Livraisons à Risque</span>
                    <Badge variant={totalLeakage === 0 ? 'default' : totalLeakage <= 3 ? 'secondary' : 'destructive'}>
                      {totalLeakage} BL
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-lg font-bold text-destructive">{highRiskCount}</p>
                      <p className="text-[10px] text-muted-foreground">Critique</p>
                    </div>
                    <div className="p-2 rounded bg-warning/10 border border-warning/20">
                      <p className="text-lg font-bold text-warning">{mediumRiskCount}</p>
                      <p className="text-[10px] text-muted-foreground">Modéré</p>
                    </div>
                    <div className="p-2 rounded bg-muted border border-border">
                      <p className="text-lg font-bold text-muted-foreground">{lowRiskCount}</p>
                      <p className="text-[10px] text-muted-foreground">Faible</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leakage Deliveries List */}
              {deliveries.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Détail des Livraisons
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {deliveries.map((delivery) => {
                      const risk = getRiskLevel(delivery);
                      return (
                        <Card 
                          key={delivery.bl_id} 
                          className={cn(
                            'border-border/50',
                            risk === 'high' && 'border-destructive/30 bg-destructive/5',
                            risk === 'medium' && 'border-warning/30 bg-warning/5'
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{delivery.client_nom}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      'text-[9px] px-1.5 py-0',
                                      risk === 'high' && 'border-destructive text-destructive',
                                      risk === 'medium' && 'border-warning text-warning'
                                    )}
                                  >
                                    {delivery.bl_id}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(delivery.date_livraison), 'd MMM', { locale: fr })} • {delivery.volume_m3} m³
                                </p>
                              </div>
                              <div className="text-right">
                                {delivery.ecart_marge !== null && delivery.ecart_marge !== 0 && (
                                  <div className="flex items-center gap-1 justify-end">
                                    <TrendingDown className={cn(
                                      'h-3 w-3',
                                      delivery.ecart_marge < 0 ? 'text-destructive' : 'text-success'
                                    )} />
                                    <span className={cn(
                                      'text-xs font-medium tabular-nums',
                                      delivery.ecart_marge < 0 ? 'text-destructive' : 'text-success'
                                    )}>
                                      {delivery.ecart_marge > 0 ? '+' : ''}{delivery.ecart_marge.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                                {delivery.marge_brute_pct !== null && (
                                  <div className="flex items-center gap-1 justify-end mt-0.5">
                                    <Percent className="h-3 w-3 text-muted-foreground" />
                                    <span className={cn(
                                      'text-xs tabular-nums',
                                      delivery.marge_brute_pct < 10 ? 'text-destructive font-medium' : 
                                      delivery.marge_brute_pct < 15 ? 'text-warning' : 'text-muted-foreground'
                                    )}>
                                      Marge: {delivery.marge_brute_pct.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Cost display */}
                            {delivery.cur_reel && delivery.prix_vente_m3 && (
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>CUR: {formatCurrency(delivery.cur_reel)}/m³</span>
                                  <span>Prix: {formatCurrency(delivery.prix_vente_m3)}/m³</span>
                                </div>
                                <Progress 
                                  value={Math.min((delivery.cur_reel / delivery.prix_vente_m3) * 100, 100)} 
                                  className="h-1.5"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card className="border-success/20 bg-success/5">
                  <CardContent className="py-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-sm font-medium text-success">Aucune fuite détectée</p>
                    <p className="text-xs text-muted-foreground mt-1">Toutes les livraisons sont dans les normes</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DrawerFooter className="pt-2">
          <Button onClick={handleGoToProduction} className="w-full">
            Audit Dosages Complet
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
