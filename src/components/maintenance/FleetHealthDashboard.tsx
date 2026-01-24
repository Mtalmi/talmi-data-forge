import { useState } from 'react';
import { useFleetMaintenance, VehicleHealth, MAINTENANCE_THRESHOLDS } from '@/hooks/useFleetMaintenance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Truck,
  Gauge,
  Droplets,
  CircleDot,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  RefreshCw,
  Eye,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceEntryForm } from './ServiceEntryForm';

export function FleetHealthDashboard() {
  const { vehicles, loading, getFleetHealthStats, fetchVehicles } = useFleetMaintenance();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleHealth | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceVehicle, setServiceVehicle] = useState<string | null>(null);

  const stats = getFleetHealthStats();

  const getStatusColor = (status: 'healthy' | 'due_soon' | 'overdue' | 'unknown') => {
    switch (status) {
      case 'healthy':
        return 'bg-success text-success-foreground';
      case 'due_soon':
        return 'bg-warning text-warning-foreground';
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getProgressColor = (status: 'healthy' | 'due_soon' | 'overdue') => {
    switch (status) {
      case 'healthy':
        return 'bg-success';
      case 'due_soon':
        return 'bg-warning';
      case 'overdue':
        return 'bg-destructive';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'due_soon' | 'overdue' | 'unknown') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'due_soon':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(km));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Véhicules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.healthy}</p>
                <p className="text-xs text-muted-foreground">En Santé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(stats.due_soon > 0 && 'border-warning/50')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.due_soon}</p>
                <p className="text-xs text-muted-foreground">À Prévoir</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(stats.overdue > 0 && 'border-destructive/50 animate-pulse')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">En Retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => fetchVehicles()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Vehicle Health Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.vehicleHealth.map((health) => (
          <Card 
            key={health.vehicle.id_camion}
            className={cn(
              'relative overflow-hidden transition-all hover:shadow-lg',
              health.overall_status === 'overdue' && 'border-destructive/50',
              health.overall_status === 'due_soon' && 'border-warning/50',
            )}
          >
            {/* Status Indicator */}
            <div className={cn(
              'absolute top-0 left-0 right-0 h-1',
              getProgressColor(health.overall_status)
            )} />

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{health.vehicle.id_camion}</CardTitle>
                </div>
                <Badge className={getStatusColor(health.overall_status)}>
                  {health.overall_status === 'healthy' ? 'OK' : 
                   health.overall_status === 'due_soon' ? 'Bientôt' : 'RETARD'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Gauge className="h-3 w-3" />
                {formatKm(health.vehicle.km_compteur)} km
                {health.vehicle.chauffeur && (
                  <span className="text-xs">• {health.vehicle.chauffeur}</span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Vidange Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    Vidange
                  </span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(health.vidange.status)}
                    {health.vidange.km_remaining > 0 
                      ? `${formatKm(health.vidange.km_remaining)} km restant`
                      : `${formatKm(Math.abs(health.vidange.km_remaining))} km dépassé`
                    }
                  </span>
                </div>
                <Progress 
                  value={health.vidange.progress_pct} 
                  className="h-2"
                  indicatorClassName={getProgressColor(health.vidange.status)}
                />
              </div>

              {/* Pneumatiques Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <CircleDot className="h-3 w-3" />
                    Pneumatiques
                  </span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(health.pneumatiques.status)}
                    {health.pneumatiques.km_remaining > 0 
                      ? `${formatKm(health.pneumatiques.km_remaining)} km restant`
                      : `${formatKm(Math.abs(health.pneumatiques.km_remaining))} km dépassé`
                    }
                  </span>
                </div>
                <Progress 
                  value={health.pneumatiques.progress_pct} 
                  className="h-2"
                  indicatorClassName={getProgressColor(health.pneumatiques.status)}
                />
              </div>

              {/* Visite Technique */}
              <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                <span className="flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  Visite Technique
                </span>
                <span className="flex items-center gap-1">
                  {getStatusIcon(health.visite_technique.status)}
                  {health.visite_technique.days_remaining !== null 
                    ? health.visite_technique.days_remaining > 0
                      ? `${health.visite_technique.days_remaining}j restant`
                      : `${Math.abs(health.visite_technique.days_remaining)}j dépassé`
                    : 'Non programmé'
                  }
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedVehicle(health)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        {health.vehicle.id_camion} - Détails Maintenance
                      </DialogTitle>
                    </DialogHeader>
                    <VehicleHealthDetails health={health} />
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setServiceVehicle(health.vehicle.id_camion);
                    setShowServiceForm(true);
                  }}
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Service
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Entry Dialog */}
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Nouveau Service - {serviceVehicle}
            </DialogTitle>
          </DialogHeader>
          {serviceVehicle && (
            <ServiceEntryForm 
              vehicleId={serviceVehicle} 
              currentKm={stats.vehicleHealth.find(h => h.vehicle.id_camion === serviceVehicle)?.vehicle.km_compteur || 0}
              onSuccess={() => {
                setShowServiceForm(false);
                setServiceVehicle(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleHealthDetails({ health }: { health: VehicleHealth }) {
  const formatKm = (km: number) => new Intl.NumberFormat('fr-FR').format(Math.round(km));
  const { vidange_km, pneumatiques_km, visite_months } = MAINTENANCE_THRESHOLDS;

  return (
    <div className="space-y-4">
      {/* Odometer */}
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <p className="text-xs text-muted-foreground mb-1">Compteur Actuel</p>
        <p className="text-3xl font-bold">{formatKm(health.vehicle.km_compteur)} km</p>
      </div>

      {/* Vidange Details */}
      <div className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Droplets className="h-4 w-4 text-blue-500" />
            Vidange (huile moteur)
          </span>
          <Badge className={health.vidange.status === 'healthy' ? 'bg-success/20 text-success' :
                           health.vidange.status === 'due_soon' ? 'bg-warning/20 text-warning' :
                           'bg-destructive/20 text-destructive'}>
            {health.vidange.status === 'healthy' ? 'OK' : 
             health.vidange.status === 'due_soon' ? 'Bientôt' : 'RETARD'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Dernier service à</p>
            <p className="font-medium">{formatKm(health.vehicle.km_last_vidange)} km</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Prochain à</p>
            <p className="font-medium">{formatKm(health.vehicle.km_last_vidange + vidange_km)} km</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Intervalle: tous les {formatKm(vidange_km)} km
        </p>
      </div>

      {/* Pneumatiques Details */}
      <div className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CircleDot className="h-4 w-4 text-gray-600" />
            Pneumatiques
          </span>
          <Badge className={health.pneumatiques.status === 'healthy' ? 'bg-success/20 text-success' :
                           health.pneumatiques.status === 'due_soon' ? 'bg-warning/20 text-warning' :
                           'bg-destructive/20 text-destructive'}>
            {health.pneumatiques.status === 'healthy' ? 'OK' : 
             health.pneumatiques.status === 'due_soon' ? 'Bientôt' : 'RETARD'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Dernier service à</p>
            <p className="font-medium">{formatKm(health.vehicle.km_last_pneumatiques)} km</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Prochain à</p>
            <p className="font-medium">{formatKm(health.vehicle.km_last_pneumatiques + pneumatiques_km)} km</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Intervalle: tous les {formatKm(pneumatiques_km)} km
        </p>
      </div>

      {/* Visite Technique Details */}
      <div className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <FileCheck className="h-4 w-4 text-primary" />
            Visite Technique
          </span>
          <Badge className={health.visite_technique.status === 'healthy' ? 'bg-success/20 text-success' :
                           health.visite_technique.status === 'due_soon' ? 'bg-warning/20 text-warning' :
                           health.visite_technique.status === 'overdue' ? 'bg-destructive/20 text-destructive' :
                           'bg-muted text-muted-foreground'}>
            {health.visite_technique.status === 'healthy' ? 'OK' : 
             health.visite_technique.status === 'due_soon' ? 'Bientôt' : 
             health.visite_technique.status === 'overdue' ? 'RETARD' : 'Non programmé'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Dernière visite</p>
            <p className="font-medium">
              {health.vehicle.date_last_visite_technique 
                ? format(new Date(health.vehicle.date_last_visite_technique), 'dd/MM/yyyy', { locale: fr })
                : 'Non enregistré'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Prochaine visite</p>
            <p className="font-medium">
              {health.visite_technique.next_date 
                ? format(new Date(health.visite_technique.next_date), 'dd/MM/yyyy', { locale: fr })
                : 'Non programmé'}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Intervalle: tous les {visite_months} mois
        </p>
      </div>
    </div>
  );
}
