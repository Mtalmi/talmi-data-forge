import { ReactNode } from 'react';
import { Inbox, Search, AlertTriangle, RefreshCw, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';

/* ── Skeleton Rows ── */
interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeletonRows({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className="border-b border-white/[0.03]">
          {Array.from({ length: columns }).map((_, c) => (
            <TableCell key={c} className="py-3">
              <div
                className="h-4 rounded animate-pulse bg-white/[0.05]"
                style={{ width: c === 0 ? '60%' : c === columns - 1 ? '40%' : '75%' }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* ── Raw skeleton rows for native <table> (no shadcn) ── */
export function RawTableSkeletonRows({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} style={{ padding: '12px 14px' }}>
              <div
                style={{
                  height: 16,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  width: c === 0 ? '60%' : c === columns - 1 ? '40%' : '75%',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Empty State (inside table body) ── */
interface TableEmptyStateProps {
  columns: number;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function TableEmptyState({
  columns,
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Icon className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/60 max-w-xs text-center">{description}</p>
          )}
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} className="mt-2">
              {actionLabel}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ── Raw empty state for native <table> ── */
export function RawTableEmptyState({
  columns,
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={columns} style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Icon size={40} style={{ color: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{title}</span>
          {description && (
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>{description}</span>
          )}
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} style={{ marginTop: 8 }}>
              {actionLabel}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Filtered Empty State ── */
interface TableFilteredEmptyProps {
  columns: number;
  onClearFilters?: () => void;
}

export function TableFilteredEmpty({ columns, onClearFilters }: TableFilteredEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Search className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Aucun résultat pour votre recherche</p>
          <p className="text-xs text-muted-foreground/60">Essayez de modifier vos filtres</p>
          {onClearFilters && (
            <Button size="sm" variant="outline" onClick={onClearFilters} className="mt-2">
              Effacer les filtres
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RawTableFilteredEmpty({ columns, onClearFilters }: TableFilteredEmptyProps) {
  return (
    <tr>
      <td colSpan={columns} style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Search size={40} style={{ color: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aucun résultat pour votre recherche</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Essayez de modifier vos filtres</span>
          {onClearFilters && (
            <Button size="sm" variant="outline" onClick={onClearFilters} style={{ marginTop: 8 }}>
              Effacer les filtres
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Error State ── */
interface TableErrorStateProps {
  columns: number;
  onRetry?: () => void;
}

export function TableErrorState({ columns, onRetry }: TableErrorStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <AlertTriangle className="h-10 w-10 text-amber-500/60" />
          <p className="text-sm font-medium text-muted-foreground">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground/60">Les données n'ont pas pu être récupérées</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="mt-2 gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Réessayer
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RawTableErrorState({ columns, onRetry }: TableErrorStateProps) {
  return (
    <tr>
      <td colSpan={columns} style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={40} style={{ color: 'rgba(245,158,11,0.6)' }} />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Erreur de chargement</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Les données n'ont pas pu être récupérées</span>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} style={{ marginTop: 8 }}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
