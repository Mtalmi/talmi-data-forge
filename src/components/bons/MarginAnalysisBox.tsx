import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarginAnalysisBoxProps {
  blId: string;
  formuleId: string;
  volumeM3: number;
  curReel: number | null;
  prixVenteM3: number | null;
  margeBrutePct: number | null;
}

interface TheoreticalCost {
  cutPerM3: number;
  totalCut: number;
}

export function MarginAnalysisBox({
  blId,
  formuleId,
  volumeM3,
  curReel,
  prixVenteM3,
  margeBrutePct,
}: MarginAnalysisBoxProps) {
  const [theoreticalCost, setTheoreticalCost] = useState<TheoreticalCost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheoreticalCost();
  }, [formuleId, volumeM3]);

  const fetchTheoreticalCost = async () => {
    try {
      // Fetch formule and calculate CUT
      const { data: formule } = await supabase
        .from('formules_theoriques')
        .select('*')
        .eq('formule_id', formuleId)
        .single();

      if (!formule) {
        setLoading(false);
        return;
      }

      // Fetch current prices
      const { data: prices } = await supabase
        .from('prix_achat_actuels')
        .select('matiere_premiere, prix_unitaire_dh');

      if (!prices) {
        setLoading(false);
        return;
      }

      // Calculate CUT per m³
      const getPrice = (keyword: string) => {
        const price = prices.find(p => 
          p.matiere_premiere.toLowerCase().includes(keyword.toLowerCase())
        );
        return price?.prix_unitaire_dh || 0;
      };

      const cimentPrice = getPrice('ciment');
      const sablePrice = getPrice('sable');
      const gravierPrice = getPrice('gravier') || getPrice('gravette');
      const eauPrice = getPrice('eau');
      const adjuvantPrice = getPrice('adjuvant') || getPrice('plastif');

      // CUT calculation per m³
      const cutPerM3 = 
        (formule.ciment_kg_m3 / 1000) * cimentPrice +
        (formule.sable_kg_m3 || 0) / 1000 * sablePrice +
        (formule.gravier_kg_m3 || 0) / 1000 * gravierPrice +
        (formule.eau_l_m3 / 1000) * eauPrice +
        (formule.adjuvant_l_m3 || 0) * adjuvantPrice;

      setTheoreticalCost({
        cutPerM3,
        totalCut: cutPerM3 * volumeM3,
      });
    } catch (error) {
      console.error('Error fetching theoretical cost:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate margins
  const curReelTotal = curReel ? curReel * volumeM3 : null;
  const prixVenteTotal = prixVenteM3 ? prixVenteM3 * volumeM3 : null;
  
  const margeBruteDH = curReelTotal && prixVenteTotal 
    ? prixVenteTotal - curReelTotal 
    : null;
  
  const calculatedMargePct = curReel && prixVenteM3 
    ? ((prixVenteM3 - curReel) / prixVenteM3) * 100 
    : margeBrutePct;

  const ecartCout = theoreticalCost && curReel 
    ? ((curReel - theoreticalCost.cutPerM3) / theoreticalCost.cutPerM3) * 100 
    : null;

  const isMarginLow = calculatedMargePct !== null && calculatedMargePct < 20;
  const hasLeakage = ecartCout !== null && ecartCout > 5;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Analyse de Marge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      isMarginLow ? "border-destructive/50 bg-destructive/5" : "border-border/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Analyse de Marge
          </CardTitle>
          {isMarginLow && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Marge Critique
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">BL {blId} • {volumeM3} m³</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Coût Théorique (CUT)</p>
            <p className="text-lg font-bold font-mono">
              {theoreticalCost ? `${theoreticalCost.cutPerM3.toFixed(2)}` : '—'}
              <span className="text-xs font-normal text-muted-foreground ml-1">DH/m³</span>
            </p>
            {theoreticalCost && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {theoreticalCost.totalCut.toFixed(2)} DH
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            hasLeakage ? "bg-destructive/10" : "bg-muted/50"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Coût Réel (CUR)</p>
            <p className={cn(
              "text-lg font-bold font-mono",
              hasLeakage && "text-destructive"
            )}>
              {curReel ? `${curReel.toFixed(2)}` : '—'}
              <span className="text-xs font-normal text-muted-foreground ml-1">DH/m³</span>
            </p>
            {curReelTotal && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {curReelTotal.toFixed(2)} DH
              </p>
            )}
          </div>
        </div>

        {/* Ecart Indicator */}
        {ecartCout !== null && (
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg text-sm",
            hasLeakage ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
          )}>
            <span className="flex items-center gap-1">
              {hasLeakage ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Écart CUR/CUT
            </span>
            <span className="font-mono font-bold">
              {ecartCout >= 0 ? '+' : ''}{ecartCout.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Margin Analysis */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Marge Brute</p>
            <p className={cn(
              "text-lg font-bold font-mono",
              isMarginLow && "text-destructive"
            )}>
              {margeBruteDH !== null ? `${margeBruteDH.toFixed(0)}` : '—'}
              <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            isMarginLow ? "bg-destructive/10" : "bg-success/10"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Marge Brute %</p>
            <p className={cn(
              "text-xl font-bold font-mono flex items-center gap-2",
              isMarginLow ? "text-destructive" : "text-success"
            )}>
              {calculatedMargePct !== null ? `${calculatedMargePct.toFixed(1)}%` : '—'}
              {isMarginLow ? (
                <TrendingDown className="h-5 w-5" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
            </p>
          </div>
        </div>

        {/* Prix de Vente Info */}
        {prixVenteM3 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Prix de Vente
            </span>
            <span className="font-mono font-bold text-primary">
              {prixVenteM3.toFixed(2)} DH/m³
            </span>
          </div>
        )}

        {/* Warning Banner */}
        {isMarginLow && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">
                  Alerte Marge Insuffisante
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  La marge brute est inférieure à 20%. Vérifiez les coûts réels et le prix de vente.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
