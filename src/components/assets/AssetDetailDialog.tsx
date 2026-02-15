import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, Truck, Cpu, Armchair, Wrench, Package,
  Calendar, MapPin, User, FileText, TrendingDown,
  CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { 
  FixedAsset, 
  DepreciationScheduleEntry, 
  AssetMaintenance,
  AssetCategory,
  DepreciationMethod,
  useFixedAssets
} from '@/hooks/useFixedAssets';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface AssetDetailDialogProps {
  asset: FixedAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  batiments: Building2, vehicules: Truck, equipements: Package,
  mobilier: Armchair, informatique: Cpu, outils: Wrench, autre: Package,
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500', active: 'bg-green-500/10 text-green-500',
  maintenance: 'bg-yellow-500/10 text-yellow-500', inactive: 'bg-gray-500/10 text-gray-500',
  pending_disposal: 'bg-orange-500/10 text-orange-500', disposed: 'bg-red-500/10 text-red-500',
};

export function AssetDetailDialog({ asset, open, onOpenChange }: AssetDetailDialogProps) {
  const { getDepreciationSchedule, getMaintenanceRecords } = useFixedAssets();
  const { t, lang } = useI18n();
  const fa = t.fixedAssets;
  const dt = fa.detail;
  const dateLocale = getDateLocale(lang);
  const [schedule, setSchedule] = useState<DepreciationScheduleEntry[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryLabels = fa.categories as Record<AssetCategory, string>;
  const statusLabels = fa.statuses as Record<string, string>;
  const deprMethodLabels = fa.depreciationMethods as Record<DepreciationMethod, string>;

  useEffect(() => {
    if (asset && open) {
      setLoading(true);
      Promise.all([
        getDepreciationSchedule(asset.id),
        getMaintenanceRecords(asset.id),
      ]).then(([scheduleData, maintenanceData]) => {
        setSchedule(scheduleData);
        setMaintenance(maintenanceData);
      }).finally(() => setLoading(false));
    }
  }, [asset, open]);

  if (!asset) return null;

  const CategoryIcon = CATEGORY_ICONS[asset.category];
  const depreciationProgress = (asset.accumulated_depreciation / (asset.purchase_price - asset.residual_value)) * 100;
  
  const warrantyDaysLeft = asset.warranty_end_date 
    ? differenceInDays(new Date(asset.warranty_end_date), new Date()) 
    : null;

  const currentDate = new Date();
  const currentPeriod = schedule.find(s => {
    const periodDate = new Date(s.period_date);
    return periodDate.getMonth() === currentDate.getMonth() && 
           periodDate.getFullYear() === currentDate.getFullYear();
  });

  const calendarLocale = dateLocale || undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CategoryIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-mono text-sm text-muted-foreground">{asset.asset_id}</span>
              <h2 className="text-xl">{asset.description}</h2>
            </div>
            <Badge className={STATUS_COLORS[asset.status]}>
              {statusLabels[asset.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{dt.tabs.details}</TabsTrigger>
            <TabsTrigger value="depreciation">{dt.tabs.depreciation}</TabsTrigger>
            <TabsTrigger value="maintenance">{dt.tabs.maintenance}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{dt.grossValue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{asset.purchase_price.toLocaleString()} DH</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{dt.accumulatedDepr}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-500">-{asset.accumulated_depreciation.toLocaleString()} DH</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{dt.nbv}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{asset.net_book_value.toLocaleString()} DH</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {dt.deprProgress}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{dt.deprLabel}</span>
                    <span>{depreciationProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(depreciationProgress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{dt.monthlyLabel}: {asset.monthly_depreciation.toLocaleString()} DH</span>
                    <span>{dt.residualLabel}: {asset.residual_value.toLocaleString()} DH</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{dt.generalInfo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.categoryLabel}</span>
                    <span className="font-medium">{categoryLabels[asset.category]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.serialLabel}</span>
                    <span className="font-mono">{asset.serial_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.locationLabel}</span>
                    <span>{asset.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.responsibleLabel}</span>
                    <span>{asset.responsible_person || dt.notAssigned}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{dt.datesWarranty}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.acquisition}</span>
                    <span>{format(new Date(asset.purchase_date), 'P', { locale: calendarLocale })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.method}</span>
                    <span>{deprMethodLabels[asset.depreciation_method]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{dt.duration}</span>
                    <span>{asset.useful_life_months} {dt.months} ({(asset.useful_life_months / 12).toFixed(1)} {dt.years})</span>
                  </div>
                  {asset.warranty_end_date && (
                    <div className="flex items-center gap-2 text-sm">
                      {warrantyDaysLeft !== null && warrantyDaysLeft > 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-muted-foreground">{dt.warranty}</span>
                      <span className={warrantyDaysLeft !== null && warrantyDaysLeft > 0 ? 'text-green-500' : 'text-red-500'}>
                        {warrantyDaysLeft !== null && warrantyDaysLeft > 0 
                          ? dt.daysRemaining.replace('{days}', String(warrantyDaysLeft))
                          : dt.expired}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="depreciation" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{dt.schedule}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">{fa.loading}</div>
                ) : schedule.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{dt.noSchedule}</div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dt.period}</TableHead>
                          <TableHead>{dt.date}</TableHead>
                          <TableHead className="text-right">{dt.allocation}</TableHead>
                          <TableHead className="text-right">{dt.cumulative}</TableHead>
                          <TableHead className="text-right">{dt.nbv}</TableHead>
                          <TableHead>{dt.status}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.slice(0, 36).map((entry) => {
                          const isCurrent = currentPeriod?.id === entry.id;
                          const isPast = new Date(entry.period_date) < new Date();
                          return (
                            <TableRow key={entry.id} className={isCurrent ? 'bg-primary/5' : ''}>
                              <TableCell className="font-mono">{entry.period_number}</TableCell>
                              <TableCell>{format(new Date(entry.period_date), 'MMM yyyy', { locale: calendarLocale })}</TableCell>
                              <TableCell className="text-right font-mono">{entry.depreciation_amount.toLocaleString()} DH</TableCell>
                              <TableCell className="text-right font-mono text-orange-500">{entry.accumulated_depreciation.toLocaleString()} DH</TableCell>
                              <TableCell className="text-right font-mono text-green-500">{entry.net_book_value.toLocaleString()} DH</TableCell>
                              <TableCell>
                                {isCurrent ? (
                                  <Badge variant="default">{dt.current}</Badge>
                                ) : isPast ? (
                                  <Badge variant="secondary">{dt.past}</Badge>
                                ) : (
                                  <Badge variant="outline">{dt.future}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {schedule.length > 36 && (
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        {dt.showingPeriods.replace('{total}', String(schedule.length))}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{dt.maintenanceHistory}</CardTitle>
                <Button variant="outline" size="sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  {dt.addMaintenance}
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">{fa.loading}</div>
                ) : maintenance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{dt.noMaintenance}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dt.date}</TableHead>
                        <TableHead>{dt.type}</TableHead>
                        <TableHead>{fa.colDescription}</TableHead>
                        <TableHead className="text-right">{dt.cost}</TableHead>
                        <TableHead>{dt.performedBy}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenance.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{format(new Date(m.maintenance_date), 'P', { locale: calendarLocale })}</TableCell>
                          <TableCell><Badge variant="outline">{m.maintenance_type}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{m.description || '-'}</TableCell>
                          <TableCell className="text-right font-mono">{m.cost > 0 ? `${m.cost.toLocaleString()} DH` : '-'}</TableCell>
                          <TableCell>{m.performed_by || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{dt.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
