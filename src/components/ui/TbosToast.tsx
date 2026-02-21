import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
}

const config = {
  success: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  error:   { icon: XCircle,     color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  info:    { icon: Info,         color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
};

export const Toast = ({ type, title, message, onClose }: ToastProps) => {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, color, bg } = config[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        animation: visible ? 'toastIn 0.3s ease forwards' : 'toastOut 0.3s ease forwards',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 12,
        background: '#1E293B',
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}15`,
        maxWidth: 380,
        minWidth: 280,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.3 }}>
          {title}
        </p>
        {message && (
          <p style={{ color: '#94A3B8', fontSize: 12, margin: '4px 0 0', lineHeight: 1.4 }}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
