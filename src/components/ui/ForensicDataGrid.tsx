import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon,
  X,
  ZoomIn,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
} from './dialog';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface ForensicDataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  photoKey?: keyof T;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Forensic Data Grid - Professional high-speed data table
 * With thumbnail previews that expand on click
 */
export function ForensicDataGrid<T extends Record<string, any>>({
  data,
  columns,
  photoKey,
  onRowClick,
  loading,
  emptyMessage = 'Aucune donnée',
  className,
}: ForensicDataGridProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return (aVal - bVal) * modifier;
  });

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border/30 overflow-hidden', className)}>
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/30 overflow-hidden', className)}>
        <div className="p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        'rounded-xl border border-border/30 overflow-hidden',
        'bg-card/30 backdrop-blur-sm',
        className
      )}>
        {/* Header */}
        <div className="grid gap-2 p-3 bg-muted/30 border-b border-border/30" 
             style={{ gridTemplateColumns: `${photoKey ? '60px ' : ''}${columns.map(c => c.width || '1fr').join(' ')}` }}>
          {photoKey && (
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {columns.map(col => (
            <button
              key={String(col.key)}
              onClick={() => col.sortable !== false && handleSort(String(col.key))}
              className={cn(
                'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                'text-left transition-colors',
                col.sortable !== false && 'hover:text-foreground cursor-pointer'
              )}
            >
              {col.header}
              {sortKey === col.key && (
                sortDirection === 'asc' 
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/20">
          {sortedData.map((row, index) => {
            const photoUrl = photoKey ? row[photoKey] : null;
            
            return (
              <div
                key={index}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'grid gap-2 p-3 items-center',
                  'transition-all duration-200',
                  'hover:bg-muted/20',
                  onRowClick && 'cursor-pointer'
                )}
                style={{ gridTemplateColumns: `${photoKey ? '60px ' : ''}${columns.map(c => c.width || '1fr').join(' ')}` }}
              >
                {/* Photo Thumbnail */}
                {photoKey && (
                  <div className="relative">
                    {photoUrl ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPhoto(photoUrl as string);
                        }}
                        className="group relative w-12 h-12 rounded-lg overflow-hidden border border-border/30 hover:border-primary/50 transition-all"
                      >
                        <img 
                          src={photoUrl as string} 
                          alt="Preuve" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[8px] text-primary-foreground">✓</span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted/30 border border-border/20 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                )}

                {/* Data Columns */}
                {columns.map(col => (
                  <div key={String(col.key)} className="text-sm truncate">
                    {col.render 
                      ? col.render(row) 
                      : row[col.key as keyof T] as ReactNode
                    }
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Expanded Dialog */}
      <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
        <DialogContent className="max-w-3xl p-0 bg-background/95 backdrop-blur-xl border-primary/20 overflow-hidden">
          {expandedPhoto && (
            <div className="relative">
              <img 
                src={expandedPhoto} 
                alt="Preuve agrandie" 
                className="w-full max-h-[80vh] object-contain"
              />
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              {/* Visual Proof Badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/90 text-primary-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">Preuve Visuelle Vérifiée</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ForensicRowDetailProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export function ForensicRowDetail({ icon, label, value }: ForensicRowDetailProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
