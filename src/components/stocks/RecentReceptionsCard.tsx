import { Package, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MouvementStock {
  id: string;
  materiau: string;
  type_mouvement: string;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  reference_id: string | null;
  fournisseur: string | null;
  numero_bl_fournisseur: string | null;
  notes: string | null;
  created_at: string;
}

interface RecentReceptionsCardProps {
  mouvements: MouvementStock[];
}

export function RecentReceptionsCard({ mouvements }: RecentReceptionsCardProps) {
  // Filter only receptions from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentReceptions = mouvements.filter(
    (m) =>
      m.type_mouvement === 'reception' &&
      new Date(m.created_at) >= sevenDaysAgo
  );

  if (recentReceptions.length === 0) {
    return null;
  }

  // Group by fournisseur for summary
  const byFournisseur: Record<string, { count: number; materials: string[] }> = {};
  recentReceptions.forEach((r) => {
    const key = r.fournisseur || 'Manuel';
    if (!byFournisseur[key]) {
      byFournisseur[key] = { count: 0, materials: [] };
    }
    byFournisseur[key].count++;
    if (!byFournisseur[key].materials.includes(r.materiau)) {
      byFournisseur[key].materials.push(r.materiau);
    }
  });

  const isFromPurchase = (m: MouvementStock) =>
    m.notes?.includes('Réception automatique') || m.reference_id?.includes('-');

  return (
    <div className="card-industrial overflow-hidden">
      <div className="p-4 border-b border-border bg-success/5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-success" />
            Réceptions Récentes
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success">
              {recentReceptions.length}
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">7 derniers jours</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20">
        {Object.entries(byFournisseur).slice(0, 4).map(([fournisseur, data]) => (
          <div
            key={fournisseur}
            className="p-3 rounded-lg bg-background border border-border"
          >
            <p className="text-xs text-muted-foreground truncate">{fournisseur}</p>
            <p className="font-bold text-lg">{data.count}</p>
            <p className="text-xs text-muted-foreground truncate">
              {data.materials.join(', ')}
            </p>
          </div>
        ))}
      </div>

      {/* Reception List */}
      <div className="divide-y divide-border max-h-64 overflow-y-auto">
        {recentReceptions.slice(0, 5).map((reception) => (
          <div
            key={reception.id}
            className={cn(
              'p-3 flex items-center gap-4 hover:bg-muted/30 transition-colors',
              isFromPurchase(reception) && 'bg-success/5'
            )}
          >
            <div
              className={cn(
                'p-2 rounded-full shrink-0',
                isFromPurchase(reception)
                  ? 'bg-success/20 text-success'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isFromPurchase(reception) ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{reception.materiau}</span>
                {isFromPurchase(reception) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success/20 text-success uppercase">
                    Commande
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {reception.fournisseur || 'Réception manuelle'}
                {reception.numero_bl_fournisseur &&
                  ` • BL: ${reception.numero_bl_fournisseur}`}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-mono font-bold text-success">
                +{reception.quantite.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(reception.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {recentReceptions.length > 5 && (
        <div className="p-2 text-center border-t border-border bg-muted/10">
          <span className="text-xs text-muted-foreground">
            +{recentReceptions.length - 5} autres réceptions
          </span>
        </div>
      )}
    </div>
  );
}
