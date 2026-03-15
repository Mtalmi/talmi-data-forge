import { useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface TBOSModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function TBOSModal({ open, onClose, title, children, footer, width = 600 }: TBOSModalProps) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`tbos-modal-title-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        setVisible(true);
        // Focus the first focusable element inside dialog
        setTimeout(() => {
          const focusable = dialogRef.current?.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
          );
          focusable?.focus();
        }, 50);
      });
    } else {
      setVisible(false);
      // Restore focus to trigger element
      setTimeout(() => previousFocusRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width, maxWidth: '95vw', maxHeight: '80vh',
          background: '#1A2332',
          border: '1px solid rgba(212,168,67,0.15)',
          borderRadius: 12,
          boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms ease, opacity 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(212,168,67,0.08)',
        }}>
          <h2
            id={titleId}
            style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4A843')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12,
            borderTop: '1px solid rgba(212,168,67,0.08)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FORM COMPONENTS ── */

const labelStyle: React.CSSProperties = {
  fontFamily: MONO, fontSize: 11, letterSpacing: '1.5px', color: '#9CA3AF',
  marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
};

const inputBaseStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,168,67,0.15)',
  borderRadius: 6, padding: '10px 14px', fontFamily: MONO, fontSize: 13, color: '#FFFFFF',
  outline: 'none', transition: 'border-color 150ms, box-shadow 150ms',
};

const errorInputStyle: React.CSSProperties = { borderColor: '#EF4444' };

interface TBOSFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export function TBOSField({ label, required, error, children, style }: TBOSFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {error && <span role="alert" style={{ fontFamily: MONO, fontSize: 11, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}

interface TBOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function TBOSInput({ hasError, style, onFocus, onBlur, ...props }: TBOSInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      aria-invalid={hasError || undefined}
      style={{
        ...inputBaseStyle,
        ...(hasError ? errorInputStyle : {}),
        ...(focused ? { borderColor: '#D4A843', boxShadow: '0 0 0 2px rgba(212,168,67,0.1)' } : {}),
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
    />
  );
}

interface TBOSSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function TBOSSelect({ hasError, options, placeholder, style, ...props }: TBOSSelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      aria-invalid={hasError || undefined}
      style={{
        ...inputBaseStyle,
        ...(hasError ? errorInputStyle : {}),
        ...(focused ? { borderColor: '#D4A843', boxShadow: '0 0 0 2px rgba(212,168,67,0.1)' } : {}),
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23D4A843' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 36,
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface TBOSTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function TBOSTextarea({ hasError, style, ...props }: TBOSTextareaProps) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      aria-invalid={hasError || undefined}
      style={{
        ...inputBaseStyle, minHeight: 80, resize: 'vertical',
        ...(hasError ? errorInputStyle : {}),
        ...(focused ? { borderColor: '#D4A843', boxShadow: '0 0 0 2px rgba(212,168,67,0.1)' } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function TBOSDisplayField({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...inputBaseStyle, background: 'rgba(255,255,255,0.02)', color: '#D4A843', fontWeight: 600, cursor: 'default' }} aria-readonly="true">
        {value ?? '—'}
      </div>
    </div>
  );
}

/* ── BUTTONS ── */

export function TBOSPrimaryButton({ children, loading, disabled, onClick, danger, style: extraStyle }: {
  children: ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void; danger?: boolean; style?: React.CSSProperties;
}) {
  const bg = danger ? '#EF4444' : '#D4A843';
  return (
    <button onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} style={{
      fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
      padding: '10px 24px', borderRadius: 6, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      background: bg, color: danger ? '#FFFFFF' : '#0F1629',
      opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8,
      transition: 'all 150ms', ...extraStyle,
    }}>
      {loading ? <GoldSpinner /> : children}
    </button>
  );
}

export function TBOSGhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
      padding: '10px 24px', borderRadius: 6, background: 'transparent',
      border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', cursor: 'pointer',
      transition: 'all 150ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.3)'; e.currentTarget.style.color = '#D4A843'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9CA3AF'; }}
    >
      {children}
    </button>
  );
}

function GoldSpinner() {
  return (
    <span
      role="status"
      aria-label="Chargement"
      style={{
        display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(212,168,67,0.3)',
        borderTopColor: '#D4A843', borderRadius: '50%', animation: 'tbos-spin 0.8s linear infinite',
      }}
    >
      <style>{`@keyframes tbos-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

/* ── SUCCESS TOAST ── */

export function showFormSuccess(message: string) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:200;
    background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);
    border-radius:8px;padding:12px 24px;
    font-family:ui-monospace,SFMono-Regular,monospace;font-size:13px;color:#22C55E;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:tbos-toast-in 300ms ease;
  `;
  el.textContent = message;
  const style = document.createElement('style');
  style.textContent = `@keyframes tbos-toast-in { from { opacity:0;transform:translateX(-50%) translateY(-12px); } to { opacity:1;transform:translateX(-50%) translateY(0); } }`;
  el.appendChild(style);
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 300ms';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* ── FORM GRID ── */

export function TBOSFormRow({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}

export function TBOSFormStack({ children, gap = 20 }: { children: ReactNode; gap?: number }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>;
}
