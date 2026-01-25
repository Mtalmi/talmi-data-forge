import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { VentesFilterState, defaultFilters } from '@/components/ventes/VentesFilters';
import { isAfter, isBefore, startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns';

interface ExpirationInfo {
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

export function useVentesFilters(
  devisList: Devis[],
  bcList: BonCommande[],
  fetchData: () => Promise<void>
) {
  const [filters, setFilters] = useState<VentesFilterState>(defaultFilters);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefreshEnabled) {
      intervalRef.current = setInterval(async () => {
        setIsRefreshing(true);
        await fetchData();
        setLastRefresh(new Date());
        setIsRefreshing(false);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Calculate expiration info for devis
  const getExpirationInfo = useCallback((devis: Devis): ExpirationInfo => {
    if (!devis.date_expiration || devis.statut !== 'en_attente') {
      return { isExpiring: false, isExpired: false, daysUntilExpiration: 999 };
    }

    const expirationDate = new Date(devis.date_expiration);
    const today = new Date();
    const daysUntil = differenceInDays(expirationDate, today);

    return {
      isExpired: daysUntil < 0,
      isExpiring: daysUntil >= 0 && daysUntil <= 7,
      daysUntilExpiration: daysUntil,
    };
  }, []);

  // Filter devis
  const filteredDevis = useMemo(() => {
    return devisList.filter((devis) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          devis.devis_id.toLowerCase().includes(searchLower) ||
          devis.client?.nom_client?.toLowerCase().includes(searchLower) ||
          devis.formule_id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter (for devis-specific statuses)
      // When 'all' is selected OR a BC-specific status is selected, show all devis
      if (filters.status !== 'all') {
        const devisStatuses = ['en_attente', 'accepte', 'converti', 'refuse', 'expire', 'annule'];
        if (devisStatuses.includes(filters.status)) {
          // Only filter if a devis-specific status is selected
          if (devis.statut !== filters.status) return false;
        }
        // If a BC-specific status is selected, still show all devis (don't filter them out)
      }

      // Client filter
      if (filters.clientId !== 'all' && devis.client_id !== filters.clientId) {
        return false;
      }

      // Formule filter
      if (filters.formuleId !== 'all' && devis.formule_id !== filters.formuleId) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const createdAt = new Date(devis.created_at);
        if (isBefore(createdAt, startOfDay(filters.dateFrom))) return false;
      }
      if (filters.dateTo) {
        const createdAt = new Date(devis.created_at);
        if (isAfter(createdAt, endOfDay(filters.dateTo))) return false;
      }

      // Volume range filter
      if (filters.volumeMin && devis.volume_m3 < parseFloat(filters.volumeMin)) {
        return false;
      }
      if (filters.volumeMax && devis.volume_m3 > parseFloat(filters.volumeMax)) {
        return false;
      }

      return true;
    });
  }, [devisList, filters]);

  // Filter BC
  const filteredBc = useMemo(() => {
    return bcList.filter((bc) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          bc.bc_id.toLowerCase().includes(searchLower) ||
          bc.client?.nom_client?.toLowerCase().includes(searchLower) ||
          bc.formule_id.toLowerCase().includes(searchLower) ||
          bc.reference_client?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter (for BC-specific statuses)
      // When 'all' is selected OR a devis-specific status is selected, show all BCs
      if (filters.status !== 'all') {
        const bcStatuses = ['pret_production', 'en_production', 'termine', 'livre'];
        if (bcStatuses.includes(filters.status)) {
          // Only filter if a BC-specific status is selected
          if (bc.statut !== filters.status) return false;
        }
        // If a devis-specific status is selected, still show all BCs (don't filter them out)
      }

      // Client filter
      if (filters.clientId !== 'all' && bc.client_id !== filters.clientId) {
        return false;
      }

      // Formule filter
      if (filters.formuleId !== 'all' && bc.formule_id !== filters.formuleId) {
        return false;
      }

      // Date range filter (use delivery date for BC)
      if (filters.dateFrom && bc.date_livraison_souhaitee) {
        const deliveryDate = new Date(bc.date_livraison_souhaitee);
        if (isBefore(deliveryDate, startOfDay(filters.dateFrom))) return false;
      }
      if (filters.dateTo && bc.date_livraison_souhaitee) {
        const deliveryDate = new Date(bc.date_livraison_souhaitee);
        if (isAfter(deliveryDate, endOfDay(filters.dateTo))) return false;
      }

      // Volume range filter
      if (filters.volumeMin && bc.volume_m3 < parseFloat(filters.volumeMin)) {
        return false;
      }
      if (filters.volumeMax && bc.volume_m3 > parseFloat(filters.volumeMax)) {
        return false;
      }

      return true;
    });
  }, [bcList, filters]);

  // Count expiring devis
  const expiringDevisCount = useMemo(() => {
    return devisList.filter((devis) => {
      const info = getExpirationInfo(devis);
      return info.isExpiring || info.isExpired;
    }).length;
  }, [devisList, getExpirationInfo]);

  return {
    filters,
    setFilters,
    filteredDevis,
    filteredBc,
    autoRefreshEnabled,
    toggleAutoRefresh,
    lastRefresh,
    isRefreshing,
    handleRefresh,
    getExpirationInfo,
    expiringDevisCount,
  };
}
