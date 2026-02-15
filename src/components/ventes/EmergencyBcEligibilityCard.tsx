import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, Zap, CheckCircle2, XCircle, Moon, Calendar, Info } from 'lucide-react';
import { useTightTimes } from '@/hooks/useTightTimes';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface EmergencyBcEligibilityCardProps {
  deliveryDate: Date | undefined;
  onEligibilityChange?: (eligible: boolean, condition: string | null) => void;
}

export function EmergencyBcEligibilityCard({ deliveryDate, onEligibilityChange }: EmergencyBcEligibilityCardProps) {
  const { checkEmergencyEligibility, isTightTimesActive, tightTimesStatus } = useTightTimes();
  const { t, lang } = useI18n();
  const eb = t.emergencyBc;
  const dateLocale = getDateLocale(lang);
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
    const checkElig = async () => {
      if (!deliveryDate) { setEligibility(null); onEligibilityChange?.(false, null); return; }
      setLoading(true);
      const result = await checkEmergencyEligibility(deliveryDate);
      setLoading(false);
      if (result) {
        setEligibility({ can_create_emergency_bc: result.can_create_emergency_bc, condition_met: result.condition_met, reason: result.reason, is_after_18h: result.is_after_18h, is_same_day: result.is_same_day, current_hour: result.current_hour });
        onEligibilityChange?.(result.can_create_emergency_bc, result.condition_met);
      }
    };
    checkElig();
  }, [deliveryDate, checkEmergencyEligibility, onEligibilityChange]);

  if (!deliveryDate) return null;

  const currentHour = new Date().getHours();
  const isAfter18h = currentHour >= 18;
  const today = new Date();
  const isSameDay = deliveryDate.toDateString() === today.toDateString();

  return (
    <Card className={eligibility?.can_create_emergency_bc ? 'border-amber-500/50 bg-amber-500/5' : 'border-muted'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className={`h-4 w-4 ${eligibility?.can_create_emergency_bc ? 'text-amber-500' : 'text-muted-foreground'}`} />
            {eb.eligibility}
          </CardTitle>
          {eligibility?.can_create_emergency_bc ? (
            <Badge className="bg-amber-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />{eb.eligible}</Badge>
          ) : (
            <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{eb.notEligible}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`p-2 rounded-lg border ${isAfter18h && isSameDay ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className={`h-4 w-4 ${isAfter18h ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="text-sm">{eb.after18hSameDay}</span>
            </div>
            {isAfter18h && isSameDay ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{currentHour}:00 {isAfter18h ? '✓' : `(${eb.before18h})`}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(deliveryDate, 'dd/MM', { locale: dateLocale || undefined })} {isSameDay ? '✓' : `(${eb.notToday})`}</span>
          </div>
        </div>

        <div className={`p-2 rounded-lg border ${isTightTimesActive ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${isTightTimesActive ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm">{eb.tightTimesMode}</span>
            </div>
            {isTightTimesActive ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
          </div>
          {isTightTimesActive && tightTimesStatus && <p className="text-xs text-muted-foreground mt-1 truncate">{tightTimesStatus.reason}</p>}
          {!isTightTimesActive && <p className="text-xs text-muted-foreground mt-1">{eb.canBeActivated}</p>}
        </div>

        {eligibility?.can_create_emergency_bc ? (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">{eb.emergencyAuthorized}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {eligibility.condition_met === 'AFTER_18H_SAME_DAY' ? eb.conditionAfter18h : eb.conditionTightTimes}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{eb.approvalRequired}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted/50 border border-muted">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium">{eb.normalProcedure}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{eb.noEmergencyCondition}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
