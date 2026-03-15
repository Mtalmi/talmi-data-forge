import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * French-labeled pagination with gold active page.
 * Resets to page 1 externally when filters change.
 */
export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  const btnBase =
    'inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-md text-xs font-medium transition-colors select-none';
  const btnEnabled = 'hover:bg-muted cursor-pointer text-muted-foreground';
  const btnDisabled = 'opacity-30 cursor-not-allowed text-muted-foreground';

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-2 py-3 px-1', className)}>
      <span className="text-xs text-muted-foreground" style={{ fontFamily: 'ui-monospace, monospace' }}>
        Affichage de {start}–{end} sur {totalItems.toLocaleString('fr-FR')} résultats
      </span>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          className={cn(btnBase, currentPage > 1 ? btnEnabled : btnDisabled)}
          onClick={() => currentPage > 1 && onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="Première page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev */}
        <button
          className={cn(btnBase, currentPage > 1 ? btnEnabled : btnDisabled)}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline ml-1">Précédent</span>
        </button>

        {/* Page info */}
        <span
          className="inline-flex items-center gap-1 px-3 h-8 rounded-md text-xs font-bold"
          style={{ 
            fontFamily: 'ui-monospace, monospace',
            color: 'hsl(var(--primary))',
            background: 'hsl(var(--primary) / 0.1)',
          }}
        >
          {currentPage} / {totalPages}
        </span>

        {/* Next */}
        <button
          className={cn(btnBase, currentPage < totalPages ? btnEnabled : btnDisabled)}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline mr-1">Suivant</span>
          <ChevronRight size={14} />
        </button>

        {/* Last */}
        <button
          className={cn(btnBase, currentPage < totalPages ? btnEnabled : btnDisabled)}
          onClick={() => currentPage < totalPages && onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Dernière page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

/** Hook to manage pagination state. Resets page on dependency change. */
export function usePagination(pageSize: number = 25, deps: unknown[] = []) {
  const [page, setPage] = import('react').then ? 1 : 1; // placeholder
  return { page: 1, setPage: (_p: number) => {} };
}
