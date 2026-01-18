import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  RefreshCw, Camera, Search, Users, Loader2
} from 'lucide-react';
import { useCreditScoreHistory, ClientTrend } from '@/hooks/useCreditScoreHistory';
import CreditScoreHistoryChart from './CreditScoreHistoryChart';
import { useToast } from '@/hooks/use-toast';

const TREND_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'critical', label: 'Critiques' },
  { value: 'declining', label: 'En Déclin' },
  { value: 'stable', label: 'Stables' },
  { value: 'improving', label: 'En Amélioration' },
];

export default function CreditScoreTrendDashboard() {
  const { toast } = useToast();
  const { 
    clientTrends, stats, loading, 
    refetch, takeSnapshot, getDecliningClients 
  } = useCreditScoreHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<ClientTrend | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);

  const filteredTrends = clientTrends.filter(trend => {
    const matchesSearch = searchTerm === '' || 
      trend.client_nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrend = trendFilter === 'all' || trend.trend === trendFilter;
    return matchesSearch && matchesTrend;
  });

  const decliningClients = getDecliningClients();

  const handleTakeSnapshot = async () => {
    setSnapshotting(true);
    const result = await takeSnapshot();
    setSnapshotting(false);

    if (result.success) {
      toast({
        title: 'Snapshot enregistré',
        description: `${result.count} score(s) client enregistré(s)`,
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Échec de la prise de snapshot',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Évolution des Scores de Crédit
          </h2>
          <p className="text-muted-foreground">
            Suivi des tendances pour détecter les payeurs à risque
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleTakeSnapshot}
            disabled={snapshotting}
          >
            {snapshotting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Prendre Snapshot
          </Button>
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alert Banner for Declining Clients */}
      {decliningClients.length > 0 && (
        <Card className="border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {decliningClients.length} client(s) avec score en déclin
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {decliningClients.slice(0, 3).map(c => c.client_nom).join(', ')}
                  {decliningClients.length > 3 && ` et ${decliningClients.length - 3} autre(s)`}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-500 text-amber-700 hover:bg-amber-100"
                onClick={() => setTrendFilter('declining')}
              >
                Voir détails
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">En Amélioration</p>
                <p className="text-2xl font-bold text-green-600">{stats.improving}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stables</p>
                <p className="text-2xl font-bold text-blue-600">{stats.stable}</p>
              </div>
              <Minus className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">En Déclin</p>
                <p className="text-2xl font-bold text-amber-600">{stats.declining}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
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
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={trendFilter} onValueChange={setTrendFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par tendance" />
          </SelectTrigger>
          <SelectContent>
            {TREND_FILTERS.map(filter => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Clients ({filteredTrends.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredTrends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucun historique de score</p>
                <p className="text-sm">Prenez un snapshot pour commencer le suivi</p>
              </div>
            ) : (
              filteredTrends.map(trend => (
                <div
                  key={trend.client_id}
                  className={`cursor-pointer transition-colors rounded-lg ${
                    selectedClient?.client_id === trend.client_id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedClient(trend)}
                >
                  <CreditScoreHistoryChart clientTrend={trend} compact />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detail View */}
        <div>
          {selectedClient ? (
            <CreditScoreHistoryChart clientTrend={selectedClient} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Sélectionnez un client pour voir l'historique détaillé
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
