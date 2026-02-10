import { useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Signal } from 'lucide-react';

interface GPSConfigSectionProps {
  vehicle: Vehicle;
  onUpdate: (updates: Partial<Vehicle>) => Promise<void>;
}

export function GPSConfigSection({ vehicle, onUpdate }: GPSConfigSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (updates: Partial<Vehicle>) => {
    setIsUpdating(true);
    try {
      await onUpdate(updates);
    } finally {
      setIsUpdating(false);
    }
  };

  const getGPSStatusBadge = () => {
    if (!vehicle.gps_enabled) {
      return <Badge variant="secondary">GPS Désactivé</Badge>;
    }

    if (!vehicle.last_gps_update) {
      return <Badge variant="outline">En attente de signal</Badge>;
    }

    const lastUpdate = new Date(vehicle.last_gps_update);
    const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);

    if (minutesAgo < 5) {
      return <Badge className="bg-emerald-500 text-white"><Signal className="w-3 h-3 mr-1" />Actif</Badge>;
    } else if (minutesAgo < 30) {
      return <Badge className="bg-amber-500 text-white"><Clock className="w-3 h-3 mr-1" />Signal faible</Badge>;
    } else {
      return <Badge variant="destructive">Signal perdu</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 border border-border rounded-2xl bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Configuration GPS
        </h3>
        {getGPSStatusBadge()}
      </div>

      {/* Enable/Disable GPS */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="gps-enabled">Activer le suivi GPS</Label>
          <p className="text-sm text-muted-foreground">
            Suivre la position en temps réel
          </p>
        </div>
        <Switch
          id="gps-enabled"
          checked={vehicle.gps_enabled}
          onCheckedChange={(enabled) => handleUpdate({ gps_enabled: enabled })}
          disabled={isUpdating}
        />
      </div>

      {vehicle.gps_enabled && (
        <>
          {/* GPS Provider */}
          <div className="space-y-2">
            <Label htmlFor="gps-provider">Type de GPS</Label>
            <Select
              value={vehicle.gps_provider || ''}
              onValueChange={(value) => handleUpdate({ gps_provider: value as Vehicle['gps_provider'] })}
              disabled={isUpdating}
            >
              <SelectTrigger id="gps-provider">
                <SelectValue placeholder="Sélectionner le type de GPS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">📱 Application Mobile (Chauffeur)</SelectItem>
                <SelectItem value="traccar">🛰️ Traccar (Hardware)</SelectItem>
                <SelectItem value="teltonika">🛰️ Teltonika (Hardware)</SelectItem>
                <SelectItem value="gpsgate">🛰️ GPS Gate (Hardware)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hardware GPS Configuration */}
          {vehicle.gps_provider && vehicle.gps_provider !== 'mobile' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="device-id">Device ID</Label>
                <Input
                  id="device-id"
                  placeholder="ex: T-001-GPS"
                  value={vehicle.gps_device_id || ''}
                  onChange={(e) => handleUpdate({ gps_device_id: e.target.value })}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imei">Numéro IMEI</Label>
                <Input
                  id="imei"
                  placeholder="15 chiffres"
                  value={vehicle.gps_imei || ''}
                  maxLength={15}
                  onChange={(e) => handleUpdate({ gps_imei: e.target.value.replace(/\D/g, '') })}
                  disabled={isUpdating}
                />
                <p className="text-xs text-muted-foreground">
                  Trouvez l'IMEI sur l'appareil GPS ou dans la documentation
                </p>
              </div>
            </>
          )}

          {/* Last Known Position */}
          {vehicle.last_latitude && vehicle.last_longitude && (
            <div className="p-3 bg-muted rounded-xl space-y-2">
              <p className="text-sm font-medium">Dernière position connue</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>{' '}
                  <code className="text-xs">{vehicle.last_latitude.toFixed(6)}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>{' '}
                  <code className="text-xs">{vehicle.last_longitude.toFixed(6)}</code>
                </div>
              </div>
              {vehicle.last_gps_update && (
                <p className="text-xs text-muted-foreground">
                  Mis à jour: {new Date(vehicle.last_gps_update).toLocaleString('fr-FR')}
                </p>
              )}
              <a
                href={`https://www.google.com/maps?q=${vehicle.last_latitude},${vehicle.last_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                Voir sur Google Maps
              </a>
            </div>
          )}

          {/* Mobile App Instructions */}
          {vehicle.gps_provider === 'mobile' && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm font-medium mb-2">
                📱 Instructions pour le chauffeur
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Ouvrir l'application TBOS Mobile</li>
                <li>Se connecter avec son compte</li>
                <li>Activer le GPS sur le téléphone</li>
                <li>Appuyer sur "Démarrer le suivi GPS"</li>
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
