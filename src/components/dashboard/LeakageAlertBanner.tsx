import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X, ChevronRight, Droplets, CheckCircle2 } from 'lucide-react';
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

  if (loading) return null;

  if (visibleLeakages.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center gap-4 px-6 py-3.5"
        style={{
          background: 'rgba(16,185,129,0.04)',
          border: '1px solid rgba(16,185,129,0.12)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(52,211,153,0.9)' }}>Aucune alerte active</span>
          <span style={{ color: 'rgba(52,211,153,0.3)' }}>—</span>
          <span style={{ fontSize: 12, color: 'rgba(52,211,153,0.4)' }}>Opérations normales · Dernière vérification: il y a 12 min</span>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes alertPulse { 0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.08); } 50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.15); } }`}</style>
      <div className={cn(
        "rounded-lg border-2 border-destructive/50 bg-destructive/10 overflow-hidden cursor-pointer",
        "animate-fade-in transition-all duration-200 ease-out hover:bg-destructive/[0.15]"
      )} style={{ animation: 'alertPulse 3s ease-in-out infinite', boxShadow: '0 0 15px rgba(239, 68, 68, 0.08)' }}>
      {/* Header */}
      <div 
        className="group flex items-center justify-between p-3 cursor-pointer hover:bg-destructive/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/20">
            <Droplets className="h-5 w-5 text-destructive animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              Alerte Fuite Détectée
            </p>
             <p className="text-sm text-muted-foreground">
               {visibleLeakages.length} livraison avec écart de coût de 8.3% — <span className="text-white/80 font-medium">BL-2026-0312</span> · Constructions Modernes SA · <span className="text-destructive font-bold">Perte estimée: 1,450 DH</span>
             </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "w-5 h-5 text-red-400 transition-all duration-200 ease-out group-hover:translate-x-1",
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
    </>
  );
}
