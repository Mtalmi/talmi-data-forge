import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X, ChevronRight, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeakageBon {
  bl_id: string;
  client_id: string;
  formule_id: string;
  cur_reel: number;
  prix_vente_m3: number;
  ecart_marge: number;
  marge_brute_pct: number;
  date_livraison: string;
}

export default function LeakageAlertBanner() {
  const [leakages, setLeakages] = useState<LeakageBon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLeakages();
  }, []);

  const fetchLeakages = async () => {
    try {
      // Fetch deliveries with leakage alerts (alerte_ecart or alerte_marge = true)
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, client_id, formule_id, cur_reel, prix_vente_m3, ecart_marge, marge_brute_pct, date_livraison')
        .or('alerte_ecart.eq.true,alerte_marge.eq.true')
        .order('date_livraison', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeakages(data || []);
    } catch (error) {
      console.error('Error fetching leakages:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissLeakage = (blId: string) => {
    setDismissed(prev => [...prev, blId]);
  };

  const visibleLeakages = leakages.filter(l => !dismissed.includes(l.bl_id));

  if (loading || visibleLeakages.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-lg border-2 border-destructive/50 bg-destructive/10 overflow-hidden",
      "animate-fade-in"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-destructive/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/20">
            <Droplets className="h-5 w-5 text-destructive animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerte Fuite Détectée
            </p>
            <p className="text-sm text-muted-foreground">
              {visibleLeakages.length} livraison(s) avec écart de coût &gt; 5%
            </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          expanded && "rotate-90"
        )} />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-destructive/20 p-3 space-y-2 max-h-48 overflow-y-auto">
          {visibleLeakages.map((leakage) => {
            const ecartPct = leakage.prix_vente_m3 && leakage.cur_reel
              ? ((leakage.cur_reel - (leakage.prix_vente_m3 * 0.75)) / (leakage.prix_vente_m3 * 0.75) * 100)
              : 0;
            
            return (
              <div 
                key={leakage.bl_id}
                className="flex items-center justify-between p-2 rounded bg-background/50"
              >
                <div className="flex-1">
                  <p className="font-mono text-sm font-medium">{leakage.bl_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {leakage.client_id} • {leakage.formule_id} • {new Date(leakage.date_livraison).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right mr-2">
                  <p className="text-sm font-mono text-destructive font-bold">
                    CUR: {leakage.cur_reel?.toFixed(2) || '—'} DH
                  </p>
                  {leakage.marge_brute_pct !== null && (
                    <p className={cn(
                      "text-xs font-medium",
                      leakage.marge_brute_pct < 15 ? "text-destructive" : "text-warning"
                    )}>
                      Marge: {leakage.marge_brute_pct.toFixed(1)}%
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissLeakage(leakage.bl_id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
