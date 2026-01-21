import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DriverDispatchCard } from './DriverDispatchCard';
import { DailyPlanningReport } from './DailyPlanningReport';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { parseISO } from 'date-fns';
import { 
  Clock, 
  Truck, 
  Factory, 
  Navigation, 
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  X,
  Package,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BonLivraison {
  bl_id: string;
  bc_id?: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  date_livraison: string;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  heure_retour_centrale: string | null;
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prestataire_id: string | null;
  clients?: { nom_client: string } | null;
  zones_livraison?: { nom_zone: string; code_zone: string } | null;
}

interface TabletPlanningViewProps {
  pendingValidation?: BonLivraison[];
  aProduire: BonLivraison[];
  enChargement: BonLivraison[];
  enLivraison: BonLivraison[];
  livresAujourdhui?: BonLivraison[];
  conflicts: { bl1: BonLivraison; bl2: BonLivraison }[];
  totalBonsToday: number;
  pendingBons: number;
  availableCamions: number;
  totalCamions: number;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  onStartProduction: (bon: BonLivraison) => void;
  onMarkDelivered: (bon: BonLivraison) => void;
  onOpenDetails: (bon: BonLivraison) => void;
  onConfirmBl?: (bon: BonLivraison) => void;
  onRejectBl?: (bon: BonLivraison) => void;
  loading?: boolean;
}

export function TabletPlanningView({
  pendingValidation = [],
  aProduire,
  enChargement,
  enLivraison,
  livresAujourdhui = [],
  conflicts,
  totalBonsToday,
  pendingBons,
  availableCamions,
  totalCamions,
  selectedDate,
  onDateChange,
  onRefresh,
  onStartProduction,
  onMarkDelivered,
  onOpenDetails,
  onConfirmBl,
  onRejectBl,
  loading = false,
}: TabletPlanningViewProps) {
  const [activeTab, setActiveTab] = useState('produire');
  const [pendingOpen, setPendingOpen] = useState(true);

  const handleRefresh = useCallback(async () => {
    await new Promise<void>((resolve) => {
      onRefresh();
      // Give time for the refresh to complete
      setTimeout(resolve, 500);
    });
  }, [onRefresh]);

  const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: loading,
  });

  return (
    <div 
      ref={containerRef}
      className="space-y-4 pb-20 overflow-y-auto h-[calc(100vh-64px)] -mx-4 px-4"
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      {/* Header - Sticky on tablet */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 pt-2 -mx-4 px-4 border-b">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold">Dispatch</h1>
          <div className="flex items-center gap-2">
            <DailyPlanningReport
              date={parseISO(selectedDate)}
              stats={{
                totalDeliveries: totalBonsToday,
                pendingCount: pendingBons,
                trucksAvailable: availableCamions,
                trucksTotal: totalCamions,
                enRouteCount: enLivraison.length,
                totalVolume: [...pendingValidation, ...aProduire, ...enChargement, ...enLivraison, ...livresAujourdhui].reduce((sum, b) => sum + b.volume_m3, 0),
                deliveredCount: livresAujourdhui.length,
              }}
              deliveries={[...pendingValidation, ...aProduire, ...enChargement, ...enLivraison, ...livresAujourdhui].map(b => ({
                bl_id: b.bl_id,
                client_name: b.clients?.nom_client || b.client_id,
                formule_id: b.formule_id,
                volume_m3: b.volume_m3,
                heure_prevue: b.heure_prevue,
                toupie_assignee: b.toupie_assignee || b.camion_assigne,
                workflow_status: b.workflow_status,
              }))}
            />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-36 h-11 touch-manipulation"
            />
            <Button 
              variant="outline" 
              size="lg"
              onClick={onRefresh} 
              disabled={loading}
              className="h-11 w-11 p-0 touch-manipulation"
            >
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Quick Stats - Touch-friendly */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 min-h-[60px]">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalBonsToday}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 min-h-[60px]">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xl font-bold">{pendingBons}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Attente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 min-h-[60px]">
            <Truck className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{availableCamions}/{totalCamions}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Dispo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 min-h-[60px]">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{enLivraison.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Route</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 Pending Validation Section - Mobile/Tablet */}
      {pendingValidation.length > 0 && onConfirmBl && onRejectBl && (
        <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
          <Card className="border-2 border-dashed border-amber-500/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer active:bg-muted/30 transition-colors pb-2 touch-manipulation">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 animate-pulse">
                    <ClipboardCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>À Confirmer</span>
                      <Badge className="bg-amber-500 text-white">{pendingValidation.length}</Badge>
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                  {pendingOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {pendingValidation.map(bon => (
                  <Card key={bon.bl_id} className="border border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{bon.bl_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {bon.clients?.nom_client || bon.client_id}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          Nouveau
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm mb-4">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{bon.formule_id}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{bon.volume_m3} m³</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="lg" 
                          className="flex-1 h-12 bg-success hover:bg-success/90 text-white gap-2 touch-manipulation"
                          onClick={() => onConfirmBl(bon)}
                        >
                          <CheckCircle className="h-5 w-5" />
                          Confirmer
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="h-12 w-12 p-0 border-destructive/50 text-destructive hover:bg-destructive/10 touch-manipulation"
                          onClick={() => onRejectBl(bon)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive text-base">Conflit Détecté!</p>
              <p className="text-sm text-muted-foreground">
                {conflicts.length} livraison(s) planifiées à moins de 15 min d'intervalle
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation - Large Touch Targets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-14 p-1 grid grid-cols-3">
          <TabsTrigger 
            value="produire" 
            className="h-12 text-sm gap-2 touch-manipulation data-[state=active]:bg-warning/20"
          >
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">À Produire</span>
            <Badge variant="secondary" className="ml-1">{aProduire.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="chargement" 
            className="h-12 text-sm gap-2 touch-manipulation data-[state=active]:bg-secondary"
          >
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Chargement</span>
            <Badge variant="secondary" className="ml-1">{enChargement.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="livraison" 
            className="h-12 text-sm gap-2 touch-manipulation data-[state=active]:bg-primary/20"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">En Route</span>
            <Badge className="ml-1">{enLivraison.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produire" className="mt-4 space-y-3">
          {aProduire.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Factory className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aucune production planifiée</p>
              </CardContent>
            </Card>
          ) : (
            aProduire.map(bon => (
              <DriverDispatchCard
                key={bon.bl_id}
                bon={bon}
                onStartProduction={() => onStartProduction(bon)}
                onOpenDetails={() => onOpenDetails(bon)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="chargement" className="mt-4 space-y-3">
          {enChargement.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aucun chargement en cours</p>
              </CardContent>
            </Card>
          ) : (
            enChargement.map(bon => (
              <DriverDispatchCard
                key={bon.bl_id}
                bon={bon}
                showActions={false}
                onOpenDetails={() => onOpenDetails(bon)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="livraison" className="mt-4 space-y-3">
          {enLivraison.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Navigation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aucun camion en route</p>
              </CardContent>
            </Card>
          ) : (
            enLivraison.map(bon => (
              <DriverDispatchCard
                key={bon.bl_id}
                bon={bon}
                onMarkDelivered={() => onMarkDelivered(bon)}
                onOpenDetails={() => onOpenDetails(bon)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Livraisons Terminées - Shows at bottom */}
      {livresAujourdhui.length > 0 && (
        <Card className="border-success/30 bg-success/5 mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-success" />
              Livrées Aujourd'hui
              <Badge variant="outline" className="ml-auto border-success/30 text-success">
                {livresAujourdhui.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {livresAujourdhui.slice(0, 5).map(bon => (
                <div 
                  key={bon.bl_id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <span className="font-mono font-medium text-sm">{bon.bl_id}</span>
                    <p className="text-xs text-muted-foreground">{bon.clients?.nom_client || bon.client_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{bon.volume_m3} m³</span>
                    <Badge variant="outline" className="ml-2 text-success border-success/30 text-xs">
                      ✓
                    </Badge>
                  </div>
                </div>
              ))}
              {livresAujourdhui.length > 5 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{livresAujourdhui.length - 5} autres livraisons
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
