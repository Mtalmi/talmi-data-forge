import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Power,
  PowerOff,
  Package,
  Truck,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useTightTimes, TightTimesTrigger } from '@/hooks/useTightTimes';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

const TRIGGER_OPTIONS: { value: TightTimesTrigger; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'STOCK_CRITICAL', 
    label: 'Stock Critique', 
    icon: <Package className="h-4 w-4" />,
    description: 'Stock < 2 jours de production'
  },
  { 
    value: 'ORDER_SURGE', 
    label: 'Pic de Commandes', 
    icon: <Zap className="h-4 w-4" />,
    description: 'Commandes > 150% de la moyenne'
  },
  { 
    value: 'EQUIPMENT_BREAKDOWN', 
    label: 'Panne Équipement', 
    icon: <Wrench className="h-4 w-4" />,
    description: 'Équipement critique en panne'
  },
  { 
    value: 'SUPPLIER_FAILURE', 
    label: 'Défaut Fournisseur', 
    icon: <Truck className="h-4 w-4" />,
    description: 'Livraison fournisseur non reçue'
  },
  { 
    value: 'QUALITY_ISSUE', 
    label: 'Problème Qualité', 
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Matériaux non conformes à remplacer'
  },
  { 
    value: 'MANUAL', 
    label: 'Activation Manuelle', 
    icon: <Power className="h-4 w-4" />,
    description: 'Autre urgence opérationnelle'
  },
];

interface TightTimesManagerProps {
  compact?: boolean;
}

export function TightTimesManager({ compact = false }: TightTimesManagerProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isCeo, isSuperviseur } = useAuth();
  const { 
    tightTimesStatus, 
    stockCriticality,
    isTightTimesActive,
    activateTightTimes,
    deactivateTightTimes,
    loading 
  } = useTightTimes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [reason, setReason] = useState('');
  const [triggeredBy, setTriggeredBy] = useState<TightTimesTrigger>('MANUAL');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [affectedMaterials, setAffectedMaterials] = useState('');
  const [notes, setNotes] = useState('');

  const canManage = isCeo || isSuperviseur;

  const handleActivate = async () => {
    if (!reason || reason.length < 10) return;
    
    setProcessing(true);
    const materials = affectedMaterials
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);
    
    const result = await activateTightTimes(
      reason,
      triggeredBy,
      parseInt(durationMinutes) || 120,
      materials.length > 0 ? materials : undefined,
      notes || undefined
    );
    
    setProcessing(false);
    if (result) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleDeactivate = async () => {
    setProcessing(true);
    await deactivateTightTimes();
    setProcessing(false);
  };

  const resetForm = () => {
    setReason('');
    setTriggeredBy('MANUAL');
    setDurationMinutes('120');
    setAffectedMaterials('');
    setNotes('');
  };

  const getRemainingTime = () => {
    if (!tightTimesStatus?.expires_at) return null;
    const expiresAt = new Date(tightTimesStatus.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return 'Expiré';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getTriggerInfo = (trigger: TightTimesTrigger) => {
    return TRIGGER_OPTIONS.find(t => t.value === trigger) || TRIGGER_OPTIONS[5];
  };

  // Compact mode for dashboard widgets
  if (compact) {
    return (
      <div className="space-y-2">
        {isTightTimesActive && tightTimesStatus ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-700">TIGHT TIMES</span>
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                  {getRemainingTime()}
                </Badge>
              </div>
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeactivate}
                  disabled={processing}
                  className="h-7 px-2 text-amber-700 hover:text-amber-900"
                >
                  <PowerOff className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {tightTimesStatus.reason}
            </p>
          </div>
        ) : canManage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="w-full gap-2 border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
          >
            <Zap className="h-4 w-4" />
            Activer TIGHT TIMES
          </Button>
        ) : null}
        
        {/* Stock criticality warning */}
        {stockCriticality?.has_critical_stocks && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700">
                {stockCriticality.critical_stocks.length} stock(s) critique(s)
              </span>
            </div>
          </div>
        )}

        {/* Activate Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Activer Mode TIGHT TIMES
              </DialogTitle>
              <DialogDescription>
                Permet la création de BC d'urgence par le Resp. Opérationnel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de Déclencheur *</Label>
                <Select value={triggeredBy} onValueChange={(v) => setTriggeredBy(v as TightTimesTrigger)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getTriggerInfo(triggeredBy).description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Raison Détaillée *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez la raison de l'activation du mode TIGHT TIMES..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label>Durée (minutes)</Label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="180">3 heures</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Matériaux Affectés (optionnel)</Label>
                <Input
                  value={affectedMaterials}
                  onChange={(e) => setAffectedMaterials(e.target.value)}
                  placeholder="Ciment, Sable, Gravette..."
                />
                <p className="text-xs text-muted-foreground">
                  Séparez par des virgules
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes Additionnelles (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations supplémentaires..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleActivate}
                disabled={processing || reason.length < 10}
                className="gap-2 bg-amber-500 hover:bg-amber-600"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Activer TIGHT TIMES
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full card mode
  return (
    <Card className={isTightTimesActive ? 'border-amber-500/50 bg-amber-500/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${isTightTimesActive ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
            <CardTitle className="text-base">Mode TIGHT TIMES</CardTitle>
          </div>
          {isTightTimesActive && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              {getRemainingTime()}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isTightTimesActive 
            ? 'BC d\'urgence autorisés pour le Resp. Opérationnel'
            : 'Désactivé - Procédure normale requise'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTightTimesActive && tightTimesStatus && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2">
              {getTriggerInfo(tightTimesStatus.triggered_by as TightTimesTrigger).icon}
              <span className="text-sm font-medium">
                {getTriggerInfo(tightTimesStatus.triggered_by as TightTimesTrigger).label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{tightTimesStatus.reason}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Par: {tightTimesStatus.activated_by_name}</span>
              <span>
                {formatDistanceToNow(new Date(tightTimesStatus.activated_at), { 
                  addSuffix: true,
                  locale: dateLocale 
                })}
              </span>
            </div>
            {tightTimesStatus.affected_materials && tightTimesStatus.affected_materials.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tightTimesStatus.affected_materials.map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stock Criticality Alert */}
        {stockCriticality?.has_critical_stocks && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Stocks Critiques Détectés</span>
            </div>
            <div className="space-y-1">
              {stockCriticality.critical_stocks.slice(0, 3).map((stock, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{stock.materiau}</span>
                  <span className={stock.is_critical ? 'text-red-600 font-medium' : 'text-amber-600'}>
                    {stock.days_remaining.toFixed(1)} jours
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {canManage && (
          <div className="flex gap-2">
            {isTightTimesActive ? (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={processing}
                className="flex-1 gap-2 border-amber-500/50 text-amber-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PowerOff className="h-4 w-4" />
                )}
                Désactiver
              </Button>
            ) : (
              <Button
                onClick={() => setDialogOpen(true)}
                className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600"
              >
                <Power className="h-4 w-4" />
                Activer TIGHT TIMES
              </Button>
            )}
          </div>
        )}

        {!canManage && !isTightTimesActive && (
          <p className="text-xs text-muted-foreground text-center">
            Seul le CEO ou Superviseur peut activer ce mode
          </p>
        )}

        {/* Activate Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Activer Mode TIGHT TIMES
              </DialogTitle>
              <DialogDescription>
                Permet la création de BC d'urgence par le Resp. Opérationnel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de Déclencheur *</Label>
                <Select value={triggeredBy} onValueChange={(v) => setTriggeredBy(v as TightTimesTrigger)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getTriggerInfo(triggeredBy).description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Raison Détaillée *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez la raison de l'activation du mode TIGHT TIMES..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label>Durée (minutes)</Label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="180">3 heures</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Matériaux Affectés (optionnel)</Label>
                <Input
                  value={affectedMaterials}
                  onChange={(e) => setAffectedMaterials(e.target.value)}
                  placeholder="Ciment, Sable, Gravette..."
                />
                <p className="text-xs text-muted-foreground">
                  Séparez par des virgules
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes Additionnelles (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations supplémentaires..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleActivate}
                disabled={processing || reason.length < 10}
                className="gap-2 bg-amber-500 hover:bg-amber-600"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Activer TIGHT TIMES
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
