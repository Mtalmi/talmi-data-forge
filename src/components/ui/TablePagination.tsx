import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

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

  const btnBase = 'inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-xs font-medium transition-colors select-none';
  const btnEnabled = 'hover:bg-muted cursor-pointer text-muted-foreground';
  const btnDisabled = 'opacity-30 cursor-not-allowed text-muted-foreground';

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-2 py-3 px-1', className)}>
      <span className="text-xs text-muted-foreground" style={{ fontFamily: 'ui-monospace, monospace' }}>
        Affichage de {start}-{end} sur {totalItems.toLocaleString('fr-FR')} resultats
      </span>

      <div className="flex items-center gap-1">
        <button
          className={cn(btnBase, currentPage > 1 ? btnEnabled : btnDisabled)}
          onClick={() => currentPage > 1 && onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="Premiere page"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          className={cn(btnBase, currentPage > 1 ? btnEnabled : btnDisabled)}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Page precedente"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline ml-1">Precedent</span>
        </button>

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

        <button
          className={cn(btnBase, currentPage < totalPages ? btnEnabled : btnDisabled)}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline mr-1">Suivant</span>
          <ChevronRight size={14} />
        </button>

        <button
          className={cn(btnBase, currentPage < totalPages ? btnEnabled : btnDisabled)}
          onClick={() => currentPage < totalPages && onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Derniere page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
