import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calculator, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarginAnalysisBoxProps {
  blId: string;
  formuleId: string;
  volumeM3: number;
  cimentReelKg: number;
  adjuvantReelL: number | null;
  eauReelL: number | null;
  prixVenteM3: number | null;
  curReelFromDb?: number | null;
  margeBrutePct?: number | null;
}

interface PriceData {
  ciment: number;
  sable: number;
  gravier: number;
  eau: number;
  adjuvant: number;
  transport: number;
}

interface FormuleData {
  ciment_kg_m3: number;
  sable_kg_m3: number | null;
  gravier_kg_m3: number | null;
  eau_l_m3: number;
  adjuvant_l_m3: number | null;
}

export function MarginAnalysisBox({
  blId,
  formuleId,
  volumeM3,
  cimentReelKg,
  adjuvantReelL,
  eauReelL,
  prixVenteM3,
  curReelFromDb,
  margeBrutePct,
}: MarginAnalysisBoxProps) {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [formule, setFormule] = useState<FormuleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [formuleId]);

  const fetchData = async () => {
    try {
      // Fetch current prices
      const { data: pricesData } = await supabase
        .from('prix_achat_actuels')
        .select('matiere_premiere, prix_unitaire_dh');

      // Fetch formule for theoretical values
      const { data: formuleData } = await supabase
        .from('formules_theoriques')
        .select('ciment_kg_m3, sable_kg_m3, gravier_kg_m3, eau_l_m3, adjuvant_l_m3')
        .eq('formule_id', formuleId)
        .single();

      if (pricesData) {
        const getPrice = (keyword: string) => {
          const price = pricesData.find(p => 
            p.matiere_premiere.toLowerCase().includes(keyword.toLowerCase())
          );
          return price?.prix_unitaire_dh || 0;
        };

        setPrices({
          ciment: getPrice('ciment'),       // DH per tonne
          sable: getPrice('sable'),         // DH per m³
          gravier: getPrice('gravier') || getPrice('gravette'),  // DH per m³
          eau: getPrice('eau'),             // DH per m³
          adjuvant: getPrice('adjuvant') || getPrice('plastif'), // DH per L
          transport: getPrice('transport') || 100, // Fixed transport cost
        });
      }

      if (formuleData) {
        setFormule(formuleData);
      }
    } catch (error) {
      console.error('Error fetching margin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== LIVE CUR CALCULATION ==========
  // CUR = (Ciment_Reel * Prix_Ciment/1000) + (Eau_Reel * Prix_Eau/1000) + (Adjuvant_Reel * Prix_Adjuvant) + Sable + Gravier (from formula)
  
  const calculateLiveCUR = (): number | null => {
    if (!prices || !formule || !cimentReelKg || volumeM3 <= 0) return null;

    // Ciment: price is per tonne, convert kg to tonnes
    const coutCiment = (cimentReelKg / 1000) * prices.ciment;
    
    // Eau: price is per m³, convert L to m³
    const eauL = eauReelL || (formule.eau_l_m3 * volumeM3);
    const coutEau = (eauL / 1000) * prices.eau;
    
    // Adjuvant: price is per L
    const adjuvantL = adjuvantReelL || (formule.adjuvant_l_m3 || 0) * volumeM3;
    const coutAdjuvant = adjuvantL * prices.adjuvant;
    
    // Sable: use theoretical (per m³, we need to convert kg to m³ using density ~1600 kg/m³)
    const sableM3 = (formule.sable_kg_m3 || 0) / 1600 * volumeM3;
    const coutSable = sableM3 * prices.sable;
    
    // Gravier: use theoretical (per m³, density ~1500 kg/m³)
    const gravierM3 = (formule.gravier_kg_m3 || 0) / 1500 * volumeM3;
    const coutGravier = gravierM3 * prices.gravier;
    
    // Total cost for the full volume
    const totalCost = coutCiment + coutEau + coutAdjuvant + coutSable + coutGravier;
    
    // CUR per m³
    return totalCost / volumeM3;
  };

  // ========== THEORETICAL CUT CALCULATION ==========
  const calculateCUT = (): number | null => {
    if (!prices || !formule) return null;

    const coutCiment = (formule.ciment_kg_m3 / 1000) * prices.ciment;
    const coutEau = (formule.eau_l_m3 / 1000) * prices.eau;
    const coutAdjuvant = (formule.adjuvant_l_m3 || 0) * prices.adjuvant;
    const coutSable = ((formule.sable_kg_m3 || 0) / 1600) * prices.sable;
    const coutGravier = ((formule.gravier_kg_m3 || 0) / 1500) * prices.gravier;

    return coutCiment + coutEau + coutAdjuvant + coutSable + coutGravier;
  };

  // Use live calculation, fall back to DB value if not calculable
  const curReel = calculateLiveCUR() ?? curReelFromDb ?? null;
  const cutTheorique = calculateCUT();

  // ========== MARGIN CALCULATIONS ==========
  // Marge Brute = Prix de Vente - CUR
  const margeBruteDH = curReel && prixVenteM3 
    ? (prixVenteM3 - curReel) * volumeM3 
    : null;
  
  // Marge Brute % = (Marge Brute / Prix de Vente) * 100
  const calculatedMargePct = curReel && prixVenteM3 && prixVenteM3 > 0
    ? ((prixVenteM3 - curReel) / prixVenteM3) * 100 
    : margeBrutePct;

  // Écart CUR/CUT
  const ecartCout = cutTheorique && curReel 
    ? ((curReel - cutTheorique) / cutTheorique) * 100 
    : null;

  // Visual alerts
  const isMarginLow = calculatedMargePct !== null && calculatedMargePct < 20;
  const isMarginCritical = calculatedMargePct !== null && calculatedMargePct < 0; // Losing money!
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
      isMarginCritical ? "border-destructive bg-destructive/5" : 
      isMarginLow ? "border-warning/50 bg-warning/5" : "border-border/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Analyse de Marge
          </CardTitle>
          {isMarginCritical ? (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              PERTE
            </Badge>
          ) : isMarginLow ? (
            <Badge variant="outline" className="border-warning text-warning animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Marge Faible
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">BL {blId} • {volumeM3} m³</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Coût Théorique (CUT)</p>
            <p className="text-lg font-bold font-mono">
              {cutTheorique ? `${cutTheorique.toFixed(2)}` : '—'}
              <span className="text-xs font-normal text-muted-foreground ml-1">DH/m³</span>
            </p>
            {cutTheorique && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {(cutTheorique * volumeM3).toFixed(2)} DH
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
            {curReel && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {(curReel * volumeM3).toFixed(2)} DH
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
              isMarginCritical ? "text-destructive" : isMarginLow ? "text-warning" : "text-success"
            )}>
              {margeBruteDH !== null ? `${margeBruteDH >= 0 ? '+' : ''}${margeBruteDH.toFixed(0)}` : '—'}
              <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            isMarginCritical ? "bg-destructive/10" : isMarginLow ? "bg-warning/10" : "bg-success/10"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Marge Brute %</p>
            <p className={cn(
              "text-xl font-bold font-mono flex items-center gap-2",
              isMarginCritical ? "text-destructive" : isMarginLow ? "text-warning" : "text-success"
            )}>
              {calculatedMargePct !== null ? `${calculatedMargePct.toFixed(1)}%` : '—'}
              {calculatedMargePct !== null && (
                calculatedMargePct >= 20 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )
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

        {/* Critical Warning Banner */}
        {isMarginCritical && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">
                  ⚠️ PERTE SUR CETTE LIVRAISON
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Le coût réel ({curReel?.toFixed(2)} DH/m³) dépasse le prix de vente ({prixVenteM3?.toFixed(2)} DH/m³).
                  Perte de {Math.abs(margeBruteDH || 0).toFixed(0)} DH.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Low Margin Warning Banner */}
        {isMarginLow && !isMarginCritical && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning text-sm">
                  Marge Insuffisante (&lt; 20%)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vérifiez les coûts réels et ajustez le prix de vente si nécessaire.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown (Debug Info) */}
        {prices && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              📊 Détail du calcul CUR
            </summary>
            <div className="mt-2 p-2 bg-muted/30 rounded space-y-1 font-mono">
              <div>Ciment: {cimentReelKg} kg × {prices.ciment}/T = {((cimentReelKg / 1000) * prices.ciment).toFixed(2)} DH</div>
              <div>Eau: {eauReelL || 'théorique'} L × {prices.eau}/m³ = {(((eauReelL || (formule?.eau_l_m3 || 0) * volumeM3) / 1000) * prices.eau).toFixed(2)} DH</div>
              <div>Adjuvant: {adjuvantReelL || 'théorique'} L × {prices.adjuvant}/L = {((adjuvantReelL || (formule?.adjuvant_l_m3 || 0) * volumeM3) * prices.adjuvant).toFixed(2)} DH</div>
              <div className="border-t pt-1 font-bold">Total: {curReel ? (curReel * volumeM3).toFixed(2) : '—'} DH</div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
