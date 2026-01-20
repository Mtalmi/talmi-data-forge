import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { DriverDeliveryCard } from '@/components/driver/DriverDeliveryCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Truck, 
  RefreshCw, 
  Package,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Camion {
  id_camion: string;
  chauffeur: string;
  immatriculation: string;
  type: string;
}

interface BonLivraison {
  bl_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  date_livraison: string;
  heure_depart_centrale: string | null;
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  clients?: { nom_client: string } | null;
  zones_livraison?: { nom_zone: string; code_zone: string } | null;
}

export default function DriverView() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [selectedCamion, setSelectedCamion] = useState<string>('');
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch available trucks/drivers
  const fetchCamions = useCallback(async () => {
    const { data, error } = await supabase
      .from('flotte')
      .select('id_camion, chauffeur, immatriculation, type')
      .order('chauffeur');

    if (error) {
      console.error('Error fetching camions:', error);
      return;
    }
    setCamions(data || []);
  }, []);

  // Fetch today's deliveries for selected truck
  const fetchDeliveries = useCallback(async () => {
    if (!selectedCamion) {
      setBons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('bons_livraison_reels')
      .select(`
        bl_id,
        client_id,
        formule_id,
        volume_m3,
        workflow_status,
        heure_prevue,
        camion_assigne,
        toupie_assignee,
        date_livraison,
        heure_depart_centrale,
        zone_livraison_id,
        mode_paiement,
        clients!inner(nom_client),
        zones_livraison(nom_zone, code_zone)
      `)
      .eq('date_livraison', today)
      .or(`camion_assigne.eq.${selectedCamion},toupie_assignee.eq.${selectedCamion}`)
      .order('heure_prevue', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Erreur lors du chargement');
    } else {
      setBons(data || []);
    }
    setLoading(false);
  }, [selectedCamion, today]);

  useEffect(() => {
    fetchCamions();
  }, [fetchCamions]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await fetchDeliveries();
  }, [fetchDeliveries]);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: loading,
  });

  // Mark as delivered
  const markDelivered = async (blId: string) => {
    const { error } = await supabase
      .from('bons_livraison_reels')
      .update({ 
        workflow_status: 'livre',
        heure_retour_centrale: format(new Date(), 'HH:mm:ss')
      })
      .eq('bl_id', blId);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Livraison confirmée!');
      fetchDeliveries();
    }
  };

  // Get selected driver info
  const selectedDriver = camions.find(c => c.id_camion === selectedCamion);

  // Stats
  const delivered = bons.filter(b => b.workflow_status === 'livre').length;
  const pending = bons.filter(b => b.workflow_status !== 'livre' && b.workflow_status !== 'annule').length;
  const totalVolume = bons.reduce((sum, b) => sum + (b.volume_m3 || 0), 0);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background pb-24 overflow-y-auto"
    >
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />

      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold">Vue Chauffeur</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchDeliveries}
              disabled={loading}
              className="h-10 w-10"
            >
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>

          {/* Driver Selector - Large Touch Target */}
          <Select value={selectedCamion} onValueChange={setSelectedCamion}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Sélectionner mon camion" />
            </SelectTrigger>
            <SelectContent>
              {camions.map(camion => (
                <SelectItem 
                  key={camion.id_camion} 
                  value={camion.id_camion}
                  className="py-3 text-base"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">{camion.id_camion}</span>
                    <span className="text-muted-foreground">- {camion.chauffeur}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        {selectedCamion && (
          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{bons.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-lg font-bold">{pending}</p>
                <p className="text-[10px] text-muted-foreground uppercase">En cours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-lg font-bold">{delivered}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Livrés</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {!selectedCamion ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <Truck className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">
                Sélectionnez votre camion pour voir vos livraisons du jour
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bons.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-success/30 mb-4" />
              <p className="text-lg font-medium mb-2">Aucune livraison</p>
              <p className="text-muted-foreground">
                Pas de livraisons prévues pour aujourd'hui
              </p>
            </CardContent>
          </Card>
        ) : (
          bons.map(bon => (
            <DriverDeliveryCard
              key={bon.bl_id}
              bon={bon}
              onMarkDelivered={() => markDelivered(bon.bl_id)}
            />
          ))
        )}
      </div>

      {/* Bottom Summary Bar */}
      {selectedCamion && bons.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-4 py-3 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Volume Total</p>
                <p className="text-xl font-bold">{totalVolume} m³</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Progression</p>
                <p className="text-xl font-bold text-success">
                  {delivered}/{bons.length}
                </p>
              </div>
            </div>
            <Badge variant={pending === 0 ? "default" : "secondary"} className="px-3 py-1">
              {pending === 0 ? '✓ Journée Complète' : `${pending} restant(s)`}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
