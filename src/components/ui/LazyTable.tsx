import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { ResponsiveCard } from './ResponsiveCard';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
  hideOnMobile?: boolean;
}

interface LazyTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  selectedId?: string | null;
  loading?: boolean;
  emptyMessage?: string;
  renderMobileCard?: (item: T, onClick?: () => void) => ReactNode;
}

/**
 * Lazy-loading table with mobile card view
 * - Desktop: Traditional table with lazy loading
 * - Mobile: Card-based layout with infinite scroll
 */
export function LazyTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  pageSize = 20,
  onRowClick,
  selectedId,
  loading = false,
  emptyMessage = 'Aucune donnée',
  renderMobileCard,
}: LazyTableProps<T>) {
  const { isMobile } = useDeviceType();
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < data.length) {
          setVisibleCount((prev) => Math.min(prev + pageSize, data.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, data.length, pageSize]);

  // Reset visible count when data changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [data.length, pageSize]);

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

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

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {visibleData.map((item) => {
          const key = String(item[keyField]);
          const isSelected = selectedId === key;

          if (renderMobileCard) {
            return (
              <div key={key}>
                {renderMobileCard(item, onRowClick ? () => onRowClick(item) : undefined)}
              </div>
            );
          }

          // Default mobile card
          return (
            <ResponsiveCard
              key={key}
              title={String(item[columns[0]?.key as keyof T] || '')}
              subtitle={columns[1] ? String(item[columns[1].key as keyof T] || '') : undefined}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              selected={isSelected}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                {columns.slice(2).filter(col => !col.hideOnMobile).map((col) => (
                  <div key={String(col.key)}>
                    <span className="text-muted-foreground text-xs">{col.header}</span>
                    <div className="font-medium">
                      {col.render ? col.render(item) : String(item[col.key as keyof T] || '-')}
                    </div>
                  </div>
                ))}
              </div>
            </ResponsiveCard>
          );
        })}

        {/* Load more trigger */}
        {hasMore && (
          <div ref={loaderRef} className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className="overflow-x-auto">
      <table className="data-table-industrial w-full">
        <thead>
          <tr>
            {columns.filter(col => !col.hideOnMobile || !isMobile).map((col) => (
              <th 
                key={String(col.key)} 
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleData.map((item) => {
            const key = String(item[keyField]);
            const isSelected = selectedId === key;

            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/30",
                  isSelected && "bg-primary/10"
                )}
              >
                {columns.filter(col => !col.hideOnMobile || !isMobile).map((col) => (
                  <td key={String(col.key)}>
                    {col.render 
                      ? col.render(item) 
                      : String(item[col.key as keyof T] || '-')
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
