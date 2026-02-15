import { cn } from '@/lib/utils';
import { Bot, CheckCircle, AlertTriangle, XCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIVerifiedBadge } from './AIVerifiedBadge';
import { useI18n } from '@/i18n/I18nContext';
import type { OCRExtractedData, VerificationResult } from '@/hooks/useAIDocumentVerification';

interface AIVerificationPanelProps {
  isScanning: boolean;
  extractedData: OCRExtractedData | null;
  verificationResult: VerificationResult | null;
  onApplySuggestion?: (field: string, value: string | number) => void;
  className?: string;
}

export function AIVerificationPanel({
  isScanning, extractedData, verificationResult, onApplySuggestion, className,
}: AIVerificationPanelProps) {
  const { t } = useI18n();
  const av = t.aiVerification;

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
              <p className="font-semibold text-primary">{av.scanning}</p>
              <p className="text-xs text-muted-foreground mt-1">{av.scanningDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!extractedData) return null;

  const hasCriticalMismatch = verificationResult?.mismatches.some(m => m.severity === 'critical');
  const hasWarningMismatch = verificationResult?.mismatches.some(m => m.severity === 'warning');

  return (
    <Card className={cn(
      'transition-all',
      hasCriticalMismatch ? 'border-destructive/50 bg-destructive/5'
        : hasWarningMismatch ? 'border-warning/50 bg-warning/5'
        : verificationResult?.isVerified ? 'border-success/50 bg-success/5'
        : 'border-primary/30 bg-primary/5',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span>{av.extractedTitle}</span>
          </div>
          {verificationResult && (
            <AIVerifiedBadge
              status={hasCriticalMismatch ? 'blocked' : hasWarningMismatch ? 'mismatch'
                : verificationResult.isVerified ? 'verified' : 'pending'}
              confidence={extractedData.confidence} compact />
          )}
          {!verificationResult && (
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {av.confidence.replace('{pct}', String(extractedData.confidence))}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {extractedData.supplier && (
            <DataField label={av.supplier} value={extractedData.supplier}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Fournisseur')}
              onApply={onApplySuggestion ? () => onApplySuggestion('supplier', extractedData.supplier!) : undefined}
              emptyLabel={av.empty} />
          )}
          {extractedData.amount !== null && (
            <DataField label={av.amount} value={`${extractedData.amount.toLocaleString()} MAD`}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Montant')}
              onApply={onApplySuggestion ? () => onApplySuggestion('amount', extractedData.amount!) : undefined}
              emptyLabel={av.empty} />
          )}
          {extractedData.bl_number && (
            <DataField label={av.blNumber} value={extractedData.bl_number}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'N° BL')}
              onApply={onApplySuggestion ? () => onApplySuggestion('bl_number', extractedData.bl_number!) : undefined}
              emptyLabel={av.empty} />
          )}
          {extractedData.date && (
            <DataField label={av.date} value={new Date(extractedData.date).toLocaleDateString('fr-FR')}
              mismatch={verificationResult?.mismatches.find(m => m.field === 'Date')}
              onApply={onApplySuggestion ? () => onApplySuggestion('date', extractedData.date!) : undefined}
              emptyLabel={av.empty} />
          )}
        </div>

        {hasCriticalMismatch && (
          <Alert variant="destructive" className="mt-3">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{av.criticalBlock}</strong> - {av.criticalDesc}
            </AlertDescription>
          </Alert>
        )}

        {hasWarningMismatch && !hasCriticalMismatch && (
          <Alert className="border-warning/50 bg-warning/10 mt-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>{av.warningTitle}</strong> - {av.warningDesc}
            </AlertDescription>
          </Alert>
        )}

        {verificationResult?.isVerified && (
          <Alert className="border-success/50 bg-success/10 mt-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              <strong>{av.verifiedTitle}</strong> - {av.verifiedDesc}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function DataField({
  label, value, mismatch, onApply, emptyLabel,
}: {
  label: string;
  value: string;
  mismatch?: { aiValue: string | number | null; userValue: string | number | null; severity: string };
  onApply?: () => void;
  emptyLabel: string;
}) {
  const hasMismatch = !!mismatch;
  const isCritical = mismatch?.severity === 'critical';

  return (
    <div className={cn(
      'p-2 rounded-lg border',
      hasMismatch
        ? isCritical ? 'border-destructive/50 bg-destructive/10' : 'border-warning/50 bg-warning/10'
        : 'border-border/50 bg-background/50'
    )}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('font-semibold truncate', hasMismatch && (isCritical ? 'text-destructive' : 'text-warning'))}>
          {value}
        </p>
        {onApply && !hasMismatch && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onApply}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
      {hasMismatch && (
        <p className="text-[10px] mt-1 opacity-80">
          {`${label}: ${mismatch.userValue?.toString() || emptyLabel}`}
        </p>
      )}
    </div>
  );
}