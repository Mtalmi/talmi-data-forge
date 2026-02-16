import { useState } from 'react';
import { Bot, ShieldAlert, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIAnomalyDetector } from '@/hooks/useAIAnomalyDetector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

export function AIAnomalyScannerWidget() {
  const { t } = useI18n();
  const ai = t.aiAnomaly;
  const { scanTransactions, isScanning, lastScan } = useAIAnomalyDetector();
  const [scanType, setScanType] = useState<string | null>(null);

  const runScan = async () => {
    setScanType('full');
    try {
      // Fetch recent expenses
      const { data: expenses } = await supabase
        .from('depenses')
        .select('id, date_depense, categorie, montant, description, created_at, created_by_name')
        .order('created_at', { ascending: false })
        .limit(30);

      // Fetch recent BLs
      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, date_livraison, volume_m3, prix_vente_m3, camion_assigne, chauffeur_nom, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      const records = [
        ...(expenses || []).map((e: any) => ({ ...e, _type: 'expense' })),
        ...(bls || []).map((b: any) => ({ ...b, _type: 'delivery' })),
      ];

      const result = await scanTransactions({
        type: 'mixed_transactions',
        records,
        context: `Scan complet: ${expenses?.length || 0} dépenses + ${bls?.length || 0} livraisons récentes`,
      });

      if (result && result.findings.length === 0) {
        toast.success(ai.noAnomalyToast);
      } else if (result) {
        toast.warning(ai.anomaliesFound.replace('{count}', String(result.findings.length)));
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(ai.scanError);
    }
  };

  const riskColors: Record<string, string> = {
    low: 'text-success border-success/30 bg-success/10',
    medium: 'text-warning border-warning/30 bg-warning/10',
    high: 'text-destructive border-destructive/30 bg-destructive/10',
    critical: 'text-destructive border-destructive/50 bg-destructive/20',
  };

  const riskIcons: Record<string, string> = {
    low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{ai.title}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runScan}
          disabled={isScanning}
          className="h-8 gap-1.5 text-xs"
        >
          {isScanning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isScanning ? ai.scanning : ai.startScan}
        </Button>
      </div>

      {isScanning && (
        <div className="flex items-center justify-center py-6 gap-3">
          <Bot className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">{ai.analyzing}</p>
            <p className="text-[10px] text-muted-foreground">{ai.checkingTransactions}</p>
          </div>
        </div>
      )}

      {!isScanning && lastScan && (
        <div className="space-y-2">
          <div className={cn('rounded-lg border p-3', riskColors[lastScan.risk_level])}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{riskIcons[lastScan.risk_level]}</span>
              <span className="font-semibold text-sm capitalize">
                {ai.riskLabel} {lastScan.risk_level === 'low' ? ai.riskLow : lastScan.risk_level === 'medium' ? ai.riskMedium : lastScan.risk_level === 'high' ? ai.riskHigh : ai.riskCritical}
              </span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {lastScan.findings.length} {ai.findings}
              </Badge>
            </div>
          </div>

          {lastScan.findings.length === 0 && (
            <div className="flex items-center gap-2 text-success text-sm py-2">
              <CheckCircle className="h-4 w-4" />
              {ai.noAnomaly}
            </div>
          )}

          {lastScan.findings.map((f, i) => (
            <div key={i} className="rounded-lg border border-border/50 p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium">{f.type}</p>
                <Badge variant={f.severity === 'critical' ? 'destructive' : 'outline'} className="text-[10px] shrink-0">
                  {f.severity}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{f.description}</p>
              {f.recommendation && (
                <p className="text-[10px] text-primary flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  {f.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!isScanning && !lastScan && (
        <div className="text-center py-4 text-muted-foreground">
          <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{ai.clickToScan}</p>
        </div>
      )}
    </div>
  );
}
