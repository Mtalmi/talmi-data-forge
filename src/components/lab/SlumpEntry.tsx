import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlumpValidation {
  isValid: boolean;
  deviation: number;
  message: string;
}

interface SlumpEntryProps {
  value: number;
  onChange: (value: number) => void;
  targetSlump?: number;
  tolerance?: number;
  disabled?: boolean;
  required?: boolean;
  onValidationChange?: (validation: SlumpValidation) => void;
}

export function SlumpEntry({
  value,
  onChange,
  targetSlump = 150,
  tolerance = 20,
  disabled = false,
  required = true,
  onValidationChange,
}: SlumpEntryProps) {
  const [validation, setValidation] = useState<SlumpValidation | null>(null);

  useEffect(() => {
    if (value > 0) {
      const deviation = value - targetSlump;
      const isValid = Math.abs(deviation) <= tolerance;
      const newValidation: SlumpValidation = {
        isValid,
        deviation,
        message: isValid 
          ? `Conforme (${deviation >= 0 ? '+' : ''}${deviation}mm)`
          : `Hors Tolérance (${deviation >= 0 ? '+' : ''}${deviation}mm vs ±${tolerance}mm)`,
      };
      setValidation(newValidation);
      onValidationChange?.(newValidation);
    } else {
      setValidation(null);
      onValidationChange?.({ isValid: true, deviation: 0, message: '' });
    }
  }, [value, targetSlump, tolerance, onValidationChange]);

  return (
    <div className="space-y-2">
      <Label className="form-label-industrial">
        Affaissement Mesuré (mm) {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={`Cible: ${targetSlump}mm (±${tolerance}mm)`}
          disabled={disabled}
          className={cn(
            'pr-10',
            validation && !validation.isValid && 'border-destructive bg-destructive/5 focus:ring-destructive'
          )}
          min={0}
          max={300}
        />
        {validation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.isValid ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
      
      {/* Tolerance indicator bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className="absolute h-full bg-success/30"
          style={{
            left: `${((targetSlump - tolerance) / 300) * 100}%`,
            width: `${((tolerance * 2) / 300) * 100}%`,
          }}
        />
        {value > 0 && (
          <div 
            className={cn(
              'absolute w-1 h-full',
              validation?.isValid ? 'bg-success' : 'bg-destructive'
            )}
            style={{
              left: `${Math.min(Math.max((value / 300) * 100, 0), 100)}%`,
            }}
          />
        )}
      </div>
      
      {/* Validation message */}
      {validation && (
        <div className={cn(
          'flex items-center gap-2 text-sm p-2 rounded',
          validation.isValid 
            ? 'bg-success/10 text-success' 
            : 'bg-destructive/10 text-destructive animate-pulse'
        )}>
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="font-medium">
            {validation.isValid ? validation.message : 'Hors Tolérance - Ajustement Requis'}
          </span>
        </div>
      )}
    </div>
  );
}
