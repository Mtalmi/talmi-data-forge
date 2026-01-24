import { cn } from '@/lib/utils';
import { Bot, CheckCircle, AlertTriangle, XCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIVerifiedBadge } from './AIVerifiedBadge';
import type { OCRExtractedData, VerificationResult } from '@/hooks/useAIDocumentVerification';

interface AIVerificationPanelProps {
  isScanning: boolean;
  extractedData: OCRExtractedData | null;
  verificationResult: VerificationResult | null;
  onApplySuggestion?: (field: string, value: string | number) => void;
  className?: string;
}

/**
 * AI Verification Panel - Shows extracted data and verification status
 * Displays smart-fill suggestions and mismatch warnings
 */
export function AIVerificationPanel({
  isScanning,
  extractedData,
  verificationResult,
  onApplySuggestion,
  className,
}: AIVerificationPanelProps) {
  if (isScanning) {
    return (
      <Card className={cn('border-primary/30 bg-primary/5', className)}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <Bot className="h-10 w-10 text-primary" />
              <Loader2 className="h-6 w-6 text-primary absolute -right-1 -bottom-1 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-primary">🤖 Analyse AI en cours...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Extraction des données du document
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!extractedData) {
    return null;
  }

  const hasCriticalMismatch = verificationResult?.mismatches.some(m => m.severity === 'critical');
  const hasWarningMismatch = verificationResult?.mismatches.some(m => m.severity === 'warning');

  return (
    <Card className={cn(
      'transition-all',
      hasCriticalMismatch 
        ? 'border-destructive/50 bg-destructive/5' 
        : hasWarningMismatch
          ? 'border-warning/50 bg-warning/5'
          : verificationResult?.isVerified
            ? 'border-success/50 bg-success/5'
            : 'border-primary/30 bg-primary/5',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span>Données Extraites par AI</span>
          </div>
          
          {verificationResult && (
            <AIVerifiedBadge
              status={
                hasCriticalMismatch ? 'blocked' :
                hasWarningMismatch ? 'mismatch' :
                verificationResult.isVerified ? 'verified' : 'pending'
              }
              confidence={extractedData.confidence}
              compact
            />
          )}
          
          {!verificationResult && (
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {extractedData.confidence}% confiance
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Extracted Data Fields */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {extractedData.supplier && (
            <DataField
              label="Fournisseur"
              value={extractedData.supplier}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Fournisseur')}
              onApply={onApplySuggestion ? () => onApplySuggestion('supplier', extractedData.supplier!) : undefined}
            />
          )}
          {extractedData.amount !== null && (
            <DataField
              label="Montant"
              value={`${extractedData.amount.toLocaleString()} MAD`}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Montant')}
              onApply={onApplySuggestion ? () => onApplySuggestion('amount', extractedData.amount!) : undefined}
            />
          )}
          {extractedData.bl_number && (
            <DataField
              label="N° BL"
              value={extractedData.bl_number}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'N° BL')}
              onApply={onApplySuggestion ? () => onApplySuggestion('bl_number', extractedData.bl_number!) : undefined}
            />
          )}
          {extractedData.date && (
            <DataField
              label="Date"
              value={new Date(extractedData.date).toLocaleDateString('fr-FR')}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Date')}
              onApply={onApplySuggestion ? () => onApplySuggestion('date', extractedData.date!) : undefined}
            />
          )}
        </div>

        {/* Critical Mismatch Alert */}
        {hasCriticalMismatch && (
          <Alert variant="destructive" className="mt-3">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>🚫 SOUMISSION BLOQUÉE</strong> - Écart critique détecté entre les données saisies et le document.
              Cette tentative a été enregistrée dans le journal forensique.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Mismatches */}
        {hasWarningMismatch && !hasCriticalMismatch && (
          <Alert className="border-warning/50 bg-warning/10 mt-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>⚠️ Écarts détectés</strong> - Vérifiez les données avant de soumettre.
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {verificationResult?.isVerified && (
          <Alert className="border-success/50 bg-success/10 mt-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              <strong>✅ AI VÉRIFIÉ</strong> - Les données correspondent au document.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Data field with optional mismatch indicator and apply button
 */
function DataField({
  label,
  value,
  mismatch,
  onApply,
}: {
  label: string;
  value: string;
  mismatch?: { aiValue: string | number | null; userValue: string | number | null; severity: string };
  onApply?: () => void;
}) {
  const hasMismatch = !!mismatch;
  const isCritical = mismatch?.severity === 'critical';

  return (
    <div className={cn(
      'p-2 rounded-lg border',
      hasMismatch
        ? isCritical
          ? 'border-destructive/50 bg-destructive/10'
          : 'border-warning/50 bg-warning/10'
        : 'border-border/50 bg-background/50'
    )}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          'font-semibold truncate',
          hasMismatch && (isCritical ? 'text-destructive' : 'text-warning')
        )}>
          {value}
        </p>
        {onApply && !hasMismatch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onApply}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
      {hasMismatch && (
        <p className="text-[10px] mt-1 opacity-80">
          Saisi: {mismatch.userValue?.toString() || 'vide'}
        </p>
      )}
    </div>
  );
}
