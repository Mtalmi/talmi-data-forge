import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Moon,
  Calendar,
  Info,
} from 'lucide-react';
import { useTightTimes } from '@/hooks/useTightTimes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmergencyBcEligibilityCardProps {
  deliveryDate: Date | undefined;
  onEligibilityChange?: (eligible: boolean, condition: string | null) => void;
}

export function EmergencyBcEligibilityCard({ 
  deliveryDate,
  onEligibilityChange 
}: EmergencyBcEligibilityCardProps) {
  const { checkEmergencyEligibility, isTightTimesActive, tightTimesStatus } = useTightTimes();
  const [eligibility, setEligibility] = useState<{
    can_create_emergency_bc: boolean;
    condition_met: string | null;
    reason: string | null;
    is_after_18h: boolean;
    is_same_day: boolean;
    current_hour: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!deliveryDate) {
        setEligibility(null);
        onEligibilityChange?.(false, null);
        return;
      }

      setLoading(true);
      const result = await checkEmergencyEligibility(deliveryDate);
      setLoading(false);
      
      if (result) {
        setEligibility({
          can_create_emergency_bc: result.can_create_emergency_bc,
          condition_met: result.condition_met,
          reason: result.reason,
          is_after_18h: result.is_after_18h,
          is_same_day: result.is_same_day,
          current_hour: result.current_hour
        });
        onEligibilityChange?.(result.can_create_emergency_bc, result.condition_met);
      }
    };

    checkEligibility();
  }, [deliveryDate, checkEmergencyEligibility, onEligibilityChange]);

  if (!deliveryDate) {
    return null;
  }

  const currentHour = new Date().getHours();
  const isAfter18h = currentHour >= 18;
  const today = new Date();
  const isSameDay = deliveryDate.toDateString() === today.toDateString();

  return (
    <Card className={eligibility?.can_create_emergency_bc 
      ? 'border-amber-500/50 bg-amber-500/5' 
      : 'border-muted'
    }>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className={`h-4 w-4 ${eligibility?.can_create_emergency_bc ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Éligibilité BC Urgence
          </CardTitle>
          {eligibility?.can_create_emergency_bc ? (
            <Badge className="bg-amber-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Éligible
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Non Éligible
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Condition 1: After 18h Same Day */}
        <div className={`p-2 rounded-lg border ${isAfter18h && isSameDay ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className={`h-4 w-4 ${isAfter18h ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="text-sm">Après 18h + Livraison Aujourd'hui</span>
            </div>
            {isAfter18h && isSameDay ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {currentHour}:00 {isAfter18h ? '✓' : '(avant 18h)'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(deliveryDate, 'dd/MM', { locale: fr })} {isSameDay ? '✓' : '(pas aujourd\'hui)'}
            </span>
          </div>
        </div>

        {/* Condition 2: Tight Times */}
        <div className={`p-2 rounded-lg border ${isTightTimesActive ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${isTightTimesActive ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm">Mode TIGHT TIMES</span>
            </div>
            {isTightTimesActive ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {isTightTimesActive && tightTimesStatus && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {tightTimesStatus.reason}
            </p>
          )}
          {!isTightTimesActive && (
            <p className="text-xs text-muted-foreground mt-1">
              Peut être activé par CEO/Superviseur
            </p>
          )}
        </div>

        {/* Result explanation */}
        {eligibility?.can_create_emergency_bc ? (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">
                  BC Urgence Autorisé
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {eligibility.condition_met === 'AFTER_18H_SAME_DAY' 
                    ? 'Condition: Après 18h pour livraison le même jour'
                    : 'Condition: Mode TIGHT TIMES actif'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approbation Max/Karim requise (30 min timeout)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted/50 border border-muted">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium">
                  Procédure Normale Requise
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aucune condition d'urgence n'est remplie. Utilisez le processus BC standard.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
