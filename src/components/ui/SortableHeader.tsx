import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/hooks/useTableSort';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
  align = 'left',
  style,
}: SortableHeaderProps) {
  const isActive = currentKey === sortKey;

  return (
    <th
      role="columnheader"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
      onClick={() => onSort(sortKey)}
      className={cn('select-none cursor-pointer group', className)}
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '1.5px',
        color: isActive ? '#D4A843' : '#9CA3AF',
        textTransform: 'uppercase',
        fontWeight: 600,
        textAlign: align,
        padding: '10px 14px',
        transition: 'color 150ms',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isActive ? (
          direction === 'asc' ? (
            <ChevronUp size={12} style={{ color: '#D4A843' }} />
          ) : (
            <ChevronDown size={12} style={{ color: '#D4A843' }} />
          )
        ) : (
          <ChevronsUpDown size={12} style={{ color: '#9CA3AF', opacity: 0.4 }} className="group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </th>
  );
}

/** shadcn TableHead variant for use inside <TableHeader> */
export function SortableTableHead({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
  align = 'left',
}: Omit<SortableHeaderProps, 'style'>) {
  const isActive = currentKey === sortKey;
  return (
    <th
      role="columnheader"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
      onClick={() => onSort(sortKey)}
      className={cn(
        'h-10 px-2 select-none cursor-pointer group transition-colors',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
      style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10,
        letterSpacing: '1.5px',
        color: isActive ? '#D4A843' : '#9CA3AF',
        textTransform: 'uppercase',
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronsUpDown size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </th>
  );
}
