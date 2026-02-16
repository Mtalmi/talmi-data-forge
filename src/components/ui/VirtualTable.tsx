import { ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
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

/**
 * Virtualized table for 10,000+ rows at 60fps.
 * Uses @tanstack/react-virtual for windowed rendering.
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

  const virtualizer = useVirtualizer({
    count: data.length,
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
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized body */}
      <div ref={parentRef} style={{ maxHeight, overflow: 'auto' }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = data[virtualRow.index];
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
        {data.length.toLocaleString()} lignes
      </div>
    </div>
  );
}
