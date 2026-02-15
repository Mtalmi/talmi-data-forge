import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, SystemAlert } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, Loader2, Check, Bell, AlertCircle, 
  Info, CheckCircle, Search, RefreshCw, Trash2, 
  ExternalLink, CheckCheck, X, Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function getNiveauConfig(t: any): Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> {
  const a = t.pages.alertes;
  return {
    critical: { icon: AlertTriangle, label: a.niveauCritical, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950/50' },
    warning: { icon: AlertCircle, label: a.niveauWarning, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950/50' },
    info: { icon: Info, label: a.niveauInfo, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950/50' },
    success: { icon: CheckCircle, label: a.niveauSuccess, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-950/50' },
  };
}

function getTypeFilters(t: any) {
  const a = t.pages.alertes;
  return [
    { value: 'all', label: a.allTypes },
    { value: 'qualite_critique', label: a.typeQuality },
    { value: 'stock_critique', label: a.typeStock },
    { value: 'marge_faible', label: a.typeMargin },
    { value: 'credit_depasse', label: a.typeCredit },
    { value: 'paiement_retard', label: a.typePayment },
    { value: 'rappel_paiement', label: a.typeReminder },
    { value: 'production_anomalie', label: a.typeProduction },
    { value: 'logistique_conflit', label: a.typeLogistics },
    { value: 'prix_hausse', label: a.typePrice },
  ];
}

export default function Alertes() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const a = t.pages.alertes;
  const { isCeo, isAccounting } = useAuth();
  const {
    alerts,
    stats,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    getAlertRoute,
    getAlertTypeLabel,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [niveauFilter, setNiveauFilter] = useState('all');

  const canManage = isCeo || isAccounting;
  const niveauConfig = useMemo(() => getNiveauConfig(t), [t]);
  const typeFilters = useMemo(() => getTypeFilters(t), [t]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = searchTerm === '' ||
        alert.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || alert.type_alerte === typeFilter;
      const matchesNiveau = niveauFilter === 'all' || alert.niveau === niveauFilter;

      return matchesSearch && matchesType && matchesNiveau;
    });
  }, [alerts, searchTerm, typeFilter, niveauFilter]);

  const unreadAlerts = filteredAlerts.filter(a => !a.lu);
  const readAlerts = filteredAlerts.filter(a => a.lu);

  const handleNavigate = (alert: SystemAlert) => {
    const route = getAlertRoute(alert);
    navigate(route);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              {a.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {a.subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            {stats.unread > 0 && canManage && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                {a.markAllRead}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{a.total}</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.unread > 0 ? 'border-primary bg-primary/5' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{a.unread}</p>
                  <p className="text-2xl font-bold text-primary">{stats.unread}</p>
                </div>
                <Bell className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.critical > 0 ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">{a.critical}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.warning > 0 ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{a.warnings}</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{a.information}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
                </div>
                <Info className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={a.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={a.alertType} />
                </SelectTrigger>
                <SelectContent>
                  {typeFilters.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={niveauFilter} onValueChange={setNiveauFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={a.level} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{a.allLevels}</SelectItem>
                  <SelectItem value="critical">{a.niveauCritical}</SelectItem>
                  <SelectItem value="warning">{a.niveauWarning}</SelectItem>
                  <SelectItem value="info">{a.niveauInfo}</SelectItem>
                </SelectContent>
              </Select>
              {(typeFilter !== 'all' || niveauFilter !== 'all' || searchTerm) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setNiveauFilter('all');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  {a.reset}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Tabs defaultValue="unread" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {a.unreadTab}
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {a.allTab} ({filteredAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-2">
            {unreadAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                  <p className="text-muted-foreground">{a.noUnread}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {a.upToDate}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {unreadAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onRead={markAsRead}
                    onDismiss={dismissAlert}
                    onNavigate={handleNavigate}
                    getTypeLabel={getAlertTypeLabel}
                    canManage={canManage}
                    niveauConfig={niveauConfig}
                    t={t}
                    dateLocale={dateLocale}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-2">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{a.noAlerts}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onRead={markAsRead}
                    onDismiss={dismissAlert}
                    onNavigate={handleNavigate}
                    getTypeLabel={getAlertTypeLabel}
                    canManage={canManage}
                    niveauConfig={niveauConfig}
                    t={t}
                    dateLocale={dateLocale}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface AlertCardProps {
  alert: SystemAlert;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (alert: SystemAlert) => void;
  getTypeLabel: (type: string) => string;
  canManage: boolean;
  niveauConfig: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }>;
  t: any;
  dateLocale: any;
}

function AlertCard({ alert, onRead, onDismiss, onNavigate, getTypeLabel, canManage, niveauConfig, t, dateLocale }: AlertCardProps) {
  const a = t.pages.alertes;
  const config = niveauConfig[alert.niveau] || niveauConfig.info;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: dateLocale || undefined });

  return (
    <Card className={cn(
      'transition-all',
      !alert.lu && 'ring-2 ring-primary/20',
      alert.niveau === 'critical' && !alert.lu && 'ring-red-500/30',
    )}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn('p-2.5 rounded-lg flex-shrink-0', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(alert.type_alerte)}
              </Badge>
              <Badge className={cn('text-xs', config.bgColor, config.color)}>
                {config.label}
              </Badge>
              {!alert.lu && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <h4 className="font-semibold mt-2">{alert.titre}</h4>
            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {alert.reference_id && (
                <span className="font-mono">{a.ref}: {alert.reference_id}</span>
              )}
              {alert.lu && alert.lu_at && (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {a.readAgo} {formatDistanceToNow(new Date(alert.lu_at), { addSuffix: true, locale: dateLocale || undefined })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(alert)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {a.view}
            </Button>
            {!alert.lu && canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRead(alert.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                {a.read}
              </Button>
            )}
            {alert.dismissible && canManage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(alert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
