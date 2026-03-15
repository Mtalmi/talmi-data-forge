import React from 'react';
import {
  FileText, BarChart3, Settings, AlertTriangle, Loader2,
  Database, Search, Inbox,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ─── EMPTY STATE ─── */
interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Rien à signaler pour le moment.',
  subtitle = 'Le prochain événement apparaîtra ici automatiquement.',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        minHeight: 240,
      }}
    >
      <Icon
        size={48}
        strokeWidth={1}
        style={{ color: 'rgba(212, 168, 67, 0.2)', marginBottom: 16 }}
      />
      <p style={{ fontFamily: MONO, fontSize: 14, color: '#9CA3AF', marginBottom: 6 }}>
        {title}
      </p>
      <p style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(156, 163, 175, 0.5)' }}>
        {subtitle}
      </p>
    </div>
  );
}

/* ─── CHART EMPTY STATE ─── */
interface ChartEmptyStateProps {
  height?: number;
  message?: string;
}

export function ChartEmptyState({
  height = 200,
  message = 'Aucune donnée disponible pour cette période',
}: ChartEmptyStateProps) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed rgba(212, 168, 67, 0.2)',
        borderRadius: 8,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <BarChart3
          size={32}
          strokeWidth={1}
          style={{ color: 'rgba(212, 168, 67, 0.15)', margin: '0 auto 8px' }}
        />
        <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

/* ─── TABLE EMPTY STATE ─── */
export function TableEmptyState({ colSpan = 1, message = 'Rien à signaler pour le moment.' }: { colSpan?: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}>{message}</p>
      </td>
    </tr>
  );
}

/* ─── AI AGENT LOADING ─── */
export function AIAgentLoading({ message = 'Analyse en cours...' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          border: '2px solid #D4A843',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: MONO, fontSize: 12, color: '#D4A843' }}>
        ⟳ {message}
      </span>
    </div>
  );
}

/* ─── ERROR / FAILED STATE ─── */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Erreur de chargement',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        minHeight: 200,
      }}
    >
      <AlertTriangle
        size={36}
        strokeWidth={1.2}
        style={{ color: '#F59E0B', marginBottom: 12 }}
      />
      <p style={{ fontFamily: MONO, fontSize: 13, color: '#F59E0B', marginBottom: 16 }}>
        ⚠ {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.5px',
            color: '#D4A843',
            background: 'transparent',
            border: '1px solid #D4A843',
            borderRadius: 6,
            padding: '8px 20px',
            cursor: 'pointer',
            transition: 'background 200ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/* ─── GENERIC LOADING (gold shimmer skeleton) ─── */
export function GoldSkeleton({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        background: 'linear-gradient(90deg, rgba(212,168,67,0.03) 0%, rgba(212,168,67,0.08) 50%, rgba(212,168,67,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'tbosShimmer 1.5s ease-in-out infinite',
        ...style,
      }}
      {...props}
    />
  );
}
