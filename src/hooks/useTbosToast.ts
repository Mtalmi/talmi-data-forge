import { toast } from 'sonner';
import { createElement } from 'react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

type ToastVariant = 'gold' | 'error' | 'success';

const VARIANT_STYLES: Record<ToastVariant, { bg: string; color: string; border: string }> = {
  gold: { bg: '#D4A843', color: '#0F1629', border: '1px solid rgba(212,168,67,0.6)' },
  error: { bg: '#EF4444', color: '#FFFFFF', border: '1px solid rgba(239,68,68,0.6)' },
  success: { bg: '#22C55E', color: '#FFFFFF', border: '1px solid rgba(34,197,94,0.6)' },
};

export function tbosToast(message: string, variant: ToastVariant = 'gold') {
  const s = VARIANT_STYLES[variant];
  toast.custom(
    (id) =>
      createElement('div', {
        onClick: () => toast.dismiss(id),
        style: {
          fontFamily: MONO,
          fontSize: 13,
          padding: '12px 24px',
          borderRadius: 8,
          background: s.bg,
          color: s.color,
          border: s.border,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: 'toastSlideIn 300ms ease-out',
          maxWidth: 480,
        },
      }, message),
    { duration: 3000, position: 'top-center' }
  );
}
