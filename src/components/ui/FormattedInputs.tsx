import { useState, useCallback, type InputHTMLAttributes, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
 * PHONE INPUT — auto-format +212 6XX XX XX XX on blur
 * ═══════════════════════════════════════════════════════ */

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  // Moroccan numbers: +212 6XX XX XX XX or 06XX XX XX XX
  const match = digits.match(/^(?:\+?212|0)(\d{9})$/);
  if (match) {
    const d = match[1];
    return `+212 ${d[0]}${d[1]}${d[2]} ${d[3]}${d[4]} ${d[5]}${d[6]} ${d[7]}${d[8]}`;
  }
  return raw; // Return as-is if not Moroccan format
}

function isPhoneValid(raw: string): boolean | null {
  if (!raw.trim()) return null; // empty = neutral
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ value, onChange, className, ...props }: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const valid = isPhoneValid(value);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (value.trim()) {
      onChange(normalizePhone(value));
    }
  }, [value, onChange]);

  return (
    <Input
      type="tel"
      inputMode="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      maxLength={20}
      className={cn(
        className,
        touched && valid === false && 'border-destructive focus-visible:ring-destructive/30',
        touched && valid === true && 'border-emerald-500/50 focus-visible:ring-emerald-500/20',
      )}
      {...props}
    />
  );
}

/* ═══════════════════════════════════════════════════════
 * CURRENCY INPUT — format with thousands on blur
 * ═══════════════════════════════════════════════════════ */

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  unit?: string; // e.g. "DH", "DH/m³"
}

export function CurrencyInput({ value, onChange, unit = 'DH', className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setFocused(true);
    // Show raw number on focus for editing
    setDisplayValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Normalize: accept comma as decimal
    const normalized = displayValue.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      onChange(num.toString());
      setDisplayValue(num.toLocaleString('fr-FR'));
    }
  }, [displayValue, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    // Also pass raw numeric value up
    const normalized = raw.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num)) onChange(num.toString());
    else if (raw === '' || raw === '-') onChange(raw);
  }, [onChange]);

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        value={focused ? displayValue : (value && !isNaN(parseFloat(value)) ? parseFloat(value).toLocaleString('fr-FR') : value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn('pr-16', className)}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
        {unit}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * UNIT INPUT — numeric input with unit suffix label
 * ═══════════════════════════════════════════════════════ */

interface UnitInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  unit: string; // e.g. "m³", "%", "kg"
  maxValue?: number;
}

export function UnitInput({ value, onChange, unit, maxValue, className, ...props }: UnitInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Allow only numbers, decimals, minus
    raw = raw.replace(/[^0-9.,\-]/g, '');
    // Enforce max
    if (maxValue !== undefined) {
      const num = parseFloat(raw.replace(',', '.'));
      if (!isNaN(num) && num > maxValue) raw = maxValue.toString();
    }
    onChange(raw);
  }, [onChange, maxValue]);

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        className={cn('pr-12', className)}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
        {unit}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * EMAIL INPUT — validate on blur with visual feedback
 * ═══════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function EmailInput({ value, onChange, className, ...props }: EmailInputProps) {
  const [touched, setTouched] = useState(false);
  const valid = !value.trim() ? null : EMAIL_RE.test(value.trim());

  return (
    <Input
      type="email"
      inputMode="email"
      autoComplete="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setTouched(true)}
      maxLength={255}
      className={cn(
        className,
        touched && valid === false && 'border-destructive focus-visible:ring-destructive/30',
        touched && valid === true && 'border-emerald-500/50 focus-visible:ring-emerald-500/20',
      )}
      {...props}
    />
  );
}
