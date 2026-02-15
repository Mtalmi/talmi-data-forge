import { useState } from 'react';
import { useDepartmentBudgets, DepartmentBudgetStatus } from '@/hooks/useDepartmentBudgets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  RefreshCw,
  Copy,
  Loader2,
  XCircle,
  Fuel,
  Wrench,
  Package,
  Truck,
  Sparkles,
  Building2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

const DEPARTMENT_ICONS: Record<string, React.ReactNode> = {
  carburant: <Fuel className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  fournitures: <Package className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  reparation: <Wrench className="h-4 w-4" />,
  nettoyage: <Sparkles className="h-4 w-4" />,
  petit_equipement: <Package className="h-4 w-4" />,
  services_externes: <Building2 className="h-4 w-4" />,
  frais_administratifs: <FileText className="h-4 w-4" />,
  autre: <HelpCircle className="h-4 w-4" />,
};

interface DepartmentBudgetWidgetProps {
  compact?: boolean;
}

export function DepartmentBudgetWidget({ compact = false }: DepartmentBudgetWidgetProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isCeo, isSuperviseur } = useAuth();
  const { budgetStatus, totals, loading, refresh, updateBudget, copyBudgetsToNextMonth } = useDepartmentBudgets();
  const [editingBudget, setEditingBudget] = useState<DepartmentBudgetStatus | null>(null);
  const [newCap, setNewCap] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const canEdit = isCeo || isSuperviseur;

  const handleSave = async () => {
    if (!editingBudget) return;
    setSaving(true);
    
    const updates: Record<string, number> = {};
    if (newCap) updates.budget_cap = parseFloat(newCap);
    if (newThreshold) updates.alert_threshold_pct = parseFloat(newThreshold);

    const success = await updateBudget(editingBudget.department, updates);
    
    if (success) {
      toast.success('Budget mis à jour');
      setEditingBudget(null);
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
    setSaving(false);
  };

  const handleCopyToNextMonth = async () => {
    setCopying(true);
    const success = await copyBudgetsToNextMonth();
    if (success) {
      toast.success('Budgets copiés vers le mois prochain');
    } else {
      toast.error('Erreur lors de la copie');
    }
    setCopying(false);
  };

  const getStatusColor = (status: DepartmentBudgetStatus) => {
    if (status.is_over_budget) return 'text-destructive';
    if (status.is_alert_triggered) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (status: DepartmentBudgetStatus) => {
    if (status.is_over_budget) return 'bg-destructive';
    if (status.is_alert_triggered) return 'bg-warning';
    return 'bg-success';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Budgets Départements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Total:</span>
            <span className="font-mono font-medium">{totals.totalBudget.toLocaleString()} MAD</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dépensé:</span>
            <span className="font-mono font-medium">{totals.totalSpent.toLocaleString()} MAD</span>
          </div>
          <Progress 
            value={totals.totalBudget > 0 ? (totals.totalSpent / totals.totalBudget) * 100 : 0} 
            className="h-2"
          />
          
          {/* Alerts */}
          <div className="flex items-center gap-2 pt-2">
            {totals.overBudgetCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                {totals.overBudgetCount} dépassé
              </Badge>
            )}
            {totals.alertCount > 0 && (
              <Badge variant="outline" className="text-xs text-warning border-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {totals.alertCount} alerte
              </Badge>
            )}
            {totals.overBudgetCount === 0 && totals.alertCount === 0 && (
              <Badge variant="outline" className="text-xs text-success border-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Tous conformes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Budgets par Département
            <Badge variant="outline" className="ml-2 font-mono">
              {format(new Date(), 'MMMM yyyy', { locale: dateLocale || undefined })}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyToNextMonth} disabled={copying}>
                    {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copier vers mois prochain</TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Budget Total</p>
            <p className="text-lg font-bold font-mono">{totals.totalBudget.toLocaleString()} MAD</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dépensé</p>
            <p className="text-lg font-bold font-mono text-warning">{totals.totalSpent.toLocaleString()} MAD</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-lg font-bold font-mono text-muted-foreground">{totals.totalPending.toLocaleString()} MAD</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Restant</p>
            <p className={cn('text-lg font-bold font-mono', totals.totalRemaining < 0 ? 'text-destructive' : 'text-success')}>
              {totals.totalRemaining.toLocaleString()} MAD
            </p>
          </div>
        </div>

        {/* Department List */}
        <div className="space-y-3">
          {budgetStatus.map((dept) => (
            <div 
              key={dept.department}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                dept.is_over_budget && 'border-destructive/50 bg-destructive/5',
                dept.is_alert_triggered && !dept.is_over_budget && 'border-warning/50 bg-warning/5',
                !dept.is_alert_triggered && 'border-border bg-card'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {DEPARTMENT_ICONS[dept.department] || <Package className="h-4 w-4" />}
                  <span className="font-medium">{dept.department_label}</span>
                  {dept.is_over_budget && (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Dépassé
                    </Badge>
                  )}
                  {dept.is_alert_triggered && !dept.is_over_budget && (
                    <Badge variant="outline" className="text-xs text-warning border-warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Alerte
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('font-mono font-bold', getStatusColor(dept))}>
                    {dept.utilization_pct}%
                  </span>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingBudget(dept);
                        setNewCap(dept.budget_cap.toString());
                        setNewThreshold(dept.alert_threshold_pct.toString());
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div 
                  className={cn('h-full transition-all', getProgressColor(dept))}
                  style={{ width: `${Math.min(100, dept.utilization_pct)}%` }}
                />
                {/* Alert threshold marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-warning/50"
                  style={{ left: `${dept.alert_threshold_pct}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <span className="font-mono">{dept.total_spent.toLocaleString()}</span>
                  {dept.total_pending > 0 && (
                    <span className="text-warning"> (+{dept.total_pending.toLocaleString()} en attente)</span>
                  )}
                </span>
                <span className="font-mono">/ {dept.budget_cap.toLocaleString()} MAD</span>
              </div>
            </div>
          ))}
        </div>

        {budgetStatus.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun budget configuré pour ce mois</p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Modifier Budget: {editingBudget?.department_label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plafond Mensuel (MAD)</Label>
              <Input
                type="number"
                value={newCap}
                onChange={(e) => setNewCap(e.target.value)}
                placeholder="Ex: 25000"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Seuil d'Alerte (%)</Label>
              <Input
                type="number"
                min="50"
                max="100"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                placeholder="Ex: 80"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Déclenche une alerte quand les dépenses atteignent ce pourcentage du plafond
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBudget(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
