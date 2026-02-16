import { cn } from '@/lib/utils';
import { Trophy, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface ProviderStats {
  proprietaire: string;
  nombre_rotations: number;
  temps_moyen_rotation: number;
  incidents_count: number;
  volume_total: number;
}

interface ProviderLeaderboardProps {
  stats: ProviderStats[];
}

export function ProviderLeaderboard({ stats }: ProviderLeaderboardProps) {
  const { t } = useI18n();
  const pl = t.providerLeaderboard;

  const formatMinutes = (minutes: number) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20 text-gray-400">
            <span className="font-bold">2</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600/20 text-amber-600">
            <span className="font-bold">3</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
            <span className="font-bold">{index + 1}</span>
          </div>
        );
    }
  };

  if (stats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {pl.noData}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stats.map((provider, index) => (
        <div
          key={provider.proprietaire}
          className={cn(
            'flex items-center gap-4 p-4 rounded-lg border transition-colors',
            index === 0 ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-muted/20 border-border'
          )}
        >
          {getRankBadge(index)}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{provider.proprietaire}</h4>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {provider.volume_total.toFixed(0)} m³
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{pl.rotations}</p>
              <p className="font-mono font-bold text-lg text-primary">{provider.nombre_rotations}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{pl.avgTime}</p>
              <p className={cn(
                'font-mono font-bold text-lg',
                provider.temps_moyen_rotation > 120 ? 'text-warning' : 'text-success'
              )}>
                {formatMinutes(provider.temps_moyen_rotation)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{pl.incidents}</p>
              <p className={cn(
                'font-mono font-bold text-lg',
                provider.incidents_count > 0 ? 'text-destructive' : 'text-success'
              )}>
                {provider.incidents_count}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
