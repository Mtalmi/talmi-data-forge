import { ReactNode, useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
  sortable?: boolean;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  rowHeight?: number;
  onRowClick?: (item: T) => void;
  selectedId?: string | null;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

type SortDir = 'asc' | 'desc' | null;

/**
 * Virtualized table for 10,000+ rows at 60fps.
 * Uses @tanstack/react-virtual for windowed rendering.
 * Supports click-to-sort on column headers.
 */
export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  rowHeight = 44,
  onRowClick,
  selectedId,
  loading = false,
  emptyMessage = 'Aucune donnée',
  maxHeight = '70vh',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey as keyof T];
      const bv = b[sortKey as keyof T];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      const sa = String(av).toLowerCase(), sb = String(bv).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sortKey, sortDir]);

  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 15,
  });

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      {/* Sticky header */}
      <div className="bg-muted/50 border-b border-border">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isActive = sortKey === String(col.key);
                return (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    className={cn(
                      "px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none",
                      isSortable && "cursor-pointer hover:text-foreground transition-colors"
                    )}
                    onClick={() => isSortable && handleSort(String(col.key))}
                    aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable && isActive && sortDir === 'asc' && <ArrowUp className="h-3 w-3" />}
                      {isSortable && isActive && sortDir === 'desc' && <ArrowDown className="h-3 w-3" />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized body */}
      <div ref={parentRef} style={{ maxHeight, overflow: 'auto' }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = sortedData[virtualRow.index];
            const key = String(item[keyField]);
            const isSelected = selectedId === key;

            return (
              <div
                key={key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table className="w-full table-fixed">
                  <tbody>
                    <tr
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                      className={cn(
                        'border-b border-border/50 transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-muted/30',
                        isSelected && 'bg-primary/10'
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          style={{ width: col.width }}
                          className="px-3 py-2 text-sm truncate"
                        >
                          {col.render
                            ? col.render(item)
                            : String(item[col.key as keyof T] || '-')}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row count footer */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/30 border-t border-border">
        {sortedData.length.toLocaleString()} lignes
      </div>
    </div>
  );
}
