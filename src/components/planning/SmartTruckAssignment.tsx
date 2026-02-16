import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Truck, 
  Star, 
  MapPin, 
  Package,
  Zap,
  AlertTriangle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface Camion {
  id_camion: string;
  immatriculation: string | null;
  chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
  telephone_chauffeur?: string | null;
}

interface BonLivraison {
  bl_id: string;
  volume_m3: number;
  zone_livraison_id: string | null;
  zones_livraison?: { nom_zone: string; code_zone: string } | null;
}

interface SmartTruckAssignmentProps {
  bon: BonLivraison;
  camions: Camion[];
  assignedTrucks: string[];
  onAssign: (camionId: string) => void;
  currentAssignment?: string | null;
}

interface TruckScore {
  camion: Camion;
  score: number;
  reasons: string[];
  isOptimal: boolean;
}

export function SmartTruckAssignment({
  bon,
  camions,
  assignedTrucks,
  onAssign,
  currentAssignment,
}: SmartTruckAssignmentProps) {
  const { t } = useI18n();
  const st = t.smartTruck;

  const scoredTrucks = useMemo<TruckScore[]>(() => {
    return camions
      .filter(c => c.statut === 'Disponible' || c.id_camion === currentAssignment)
      .map(camion => {
        let score = 50;
        const reasons: string[] = [];

        const capacity = camion.capacite_m3 || 8;
        if (capacity >= bon.volume_m3) {
          if (capacity - bon.volume_m3 <= 2) {
            score += 30;
            reasons.push(st.optimalCapacity);
          } else {
            score += 15;
            reasons.push(st.sufficientCapacity);
          }
        } else {
          score -= 20;
          reasons.push(st.insufficientCapacity);
        }

        if (!assignedTrucks.includes(camion.id_camion)) {
          score += 20;
          reasons.push(st.available);
        } else {
          score -= 10;
          reasons.push(st.alreadyAssigned);
        }

        if (camion.chauffeur) {
          score += 10;
          reasons.push(st.driverAssigned);
        }

        if (camion.id_camion === currentAssignment) {
          score += 5;
          reasons.push(st.currentAssignment);
        }

        return {
          camion,
          score,
          reasons,
          isOptimal: score >= 90,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [camions, bon, assignedTrucks, currentAssignment, st]);

  const optimalTruck = scoredTrucks.find(t => t.isOptimal);

  if (scoredTrucks.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-2 text-destructive" />
        {st.noTrucks}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {optimalTruck && optimalTruck.camion.id_camion !== currentAssignment && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">{st.recommended}</span>
            </div>
            <Button
              size="sm"
              onClick={() => onAssign(optimalTruck.camion.id_camion)}
              className="h-8 gap-2 bg-success hover:bg-success/90"
            >
              <Zap className="h-3 w-3" />
              {st.assign} {optimalTruck.camion.id_camion}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {optimalTruck.reasons.map((reason, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {scoredTrucks.slice(0, 5).map(({ camion, score, reasons, isOptimal }) => (
          <div
            key={camion.id_camion}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border transition-all",
              camion.id_camion === currentAssignment
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-1.5 rounded-lg",
                isOptimal ? "bg-success/20" : "bg-muted"
              )}>
                <Truck className={cn(
                  "h-4 w-4",
                  isOptimal ? "text-success" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">{camion.id_camion}</span>
                  {camion.id_camion === currentAssignment && (
                    <Badge variant="outline" className="text-xs border-primary text-primary">
                      <Check className="h-3 w-3 mr-1" />
                      {st.current}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{camion.chauffeur || st.noDriver}</span>
                  <span>•</span>
                  <span>{camion.capacite_m3 || 8} m³</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    score >= 90 ? "bg-success/20 text-success" :
                    score >= 70 ? "bg-warning/20 text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {score}%
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="font-semibold mb-1">{st.compatibilityScore}</p>
                  <ul className="text-xs space-y-0.5">
                    {reasons.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
              {camion.id_camion !== currentAssignment && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssign(camion.id_camion)}
                  className="h-7 text-xs"
                >
                  {st.assign}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
