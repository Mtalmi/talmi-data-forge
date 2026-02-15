import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
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
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NIVEAU_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  critical: { icon: AlertTriangle, label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950/50' },
  warning: { icon: AlertCircle, label: 'Avertissement', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950/50' },
  info: { icon: Info, label: 'Information', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950/50' },
  success: { icon: CheckCircle, label: 'Succès', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-950/50' },
};

const TYPE_FILTERS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'qualite_critique', label: 'Qualité' },
  { value: 'stock_critique', label: 'Stock' },
  { value: 'marge_faible', label: 'Marge' },
  { value: 'credit_depasse', label: 'Crédit' },
  { value: 'paiement_retard', label: 'Paiement' },
  { value: 'rappel_paiement', label: 'Rappel' },
  { value: 'production_anomalie', label: 'Production' },
  { value: 'logistique_conflit', label: 'Logistique' },
  { value: 'prix_hausse', label: 'Prix' },
];

export default function Alertes() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
              {t.pages.alertes.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.pages.alertes.subtitle || 'Alertes système centralisées en temps réel'}
            </p>
          </div>
          <div className="flex gap-2">
            {stats.unread > 0 && canManage && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout marquer lu
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
                  <p className="text-sm text-muted-foreground">Total</p>
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
                  <p className="text-sm text-muted-foreground">Non lues</p>
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
                  <p className="text-sm text-red-700 dark:text-red-300">Critiques</p>
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
                  <p className="text-sm text-amber-700 dark:text-amber-300">Avertissements</p>
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
                  <p className="text-sm text-muted-foreground">Informations</p>
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
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type d'alerte" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FILTERS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={niveauFilter} onValueChange={setNiveauFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
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
                  Réinitialiser
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
              Non lues
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Toutes ({filteredAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-2">
            {unreadAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                  <p className="text-muted-foreground">Aucune notification non lue</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vous êtes à jour !
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
                  <p className="text-muted-foreground">Aucune alerte</p>
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
}

function AlertCard({ alert, onRead, onDismiss, onNavigate, getTypeLabel, canManage }: AlertCardProps) {
  const config = NIVEAU_CONFIG[alert.niveau] || NIVEAU_CONFIG.info;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr });

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
                <span className="font-mono">Réf: {alert.reference_id}</span>
              )}
              {alert.lu && alert.lu_at && (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Lu {formatDistanceToNow(new Date(alert.lu_at), { addSuffix: true, locale: fr })}
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
              Voir
            </Button>
            {!alert.lu && canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRead(alert.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                Lu
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
