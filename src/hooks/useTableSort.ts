import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

export function useTableSort<T extends Record<string, any>>(
  data: T[],
  defaultKey?: string,
  defaultDirection: SortDirection = 'desc'
) {
  const [sort, setSort] = useState<SortState>({
    key: defaultKey ?? null,
    direction: defaultKey ? defaultDirection : null,
  });

  const handleSort = useCallback((key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null }; // 3rd click = reset
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    const k = sort.key;
    return [...data].sort((a, b) => {
      const av = a[k];
      const bv = b[k];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime();
      } else {
        cmp = String(av).localeCompare(String(bv), 'fr', { numeric: true });
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort.key, sort.direction]);

  return { sortedData, sortKey: sort.key, sortDirection: sort.direction, handleSort };
}
