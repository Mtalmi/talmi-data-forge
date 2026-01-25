import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  id: string;
  contract_type: 'camion_rental' | 'trax_rental' | 'terrain_rental';
  title: string;
  description: string | null;
  provider_name: string;
  fournisseur_id: string | null;
  monthly_amount: number;
  start_date: string;
  end_date: string | null;
  pdf_url: string;
  is_active: boolean;
  ras_applicable: boolean;
  ras_rate: number;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  equipment_count: number;
  equipment_description: string | null;
  created_at: string;
}

export interface ContractComplianceStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number; // within 30 days
  expired: number;
  missingContracts: number;
  monthlyTotal: number;
  annualTotal: number;
  complianceRate: number; // percentage
  potentialNonDeductible: number;
}

export interface ExpirationAlert {
  contractId: string;
  title: string;
  providerName: string;
  endDate: string;
  daysUntilExpiration: number;
  alertType: 'expiring_30' | 'expiring_7' | 'expired';
}

export function useContractCompliance() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractComplianceStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiringSoon: 0,
    expired: 0,
    missingContracts: 3, // STMX Trax x2, VADINA Terrain
    monthlyTotal: 0,
    annualTotal: 0,
    complianceRate: 0,
    potentialNonDeductible: 0,
  });
  const [expirationAlerts, setExpirationAlerts] = useState<ExpirationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<{ id: string; nom_fournisseur: string }[]>([]);

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase
      .from('fournisseurs')
      .select('id, nom_fournisseur')
      .eq('actif', true)
      .order('nom_fournisseur');
    
    if (data) setSuppliers(data);
  }, []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const contractData = (data || []) as Contract[];
      setContracts(contractData);

      // Calculate stats
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const activeContracts = contractData.filter(c => c.is_active);
      const expiringSoon = activeContracts.filter(c => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        return endDate >= today && endDate <= in30Days;
      });
      const expired = contractData.filter(c => {
        if (!c.end_date) return false;
        return new Date(c.end_date) < today;
      });

      const monthlyTotal = activeContracts.reduce((sum, c) => sum + c.monthly_amount, 0);
      
      // Known missing contracts (from audit): 2 Trax + 1 Terrain
      const knownMissingMonthly = 70000 + 20000; // 2 Trax @ 35k each + Terrain @ 20k
      
      // Compliance rate = contracts with valid docs / total expected
      const totalExpected = activeContracts.length + 3; // +3 for known missing
      const complianceRate = totalExpected > 0 ? (activeContracts.length / totalExpected) * 100 : 100;

      setStats({
        totalContracts: contractData.length,
        activeContracts: activeContracts.length,
        expiringSoon: expiringSoon.length,
        expired: expired.length,
        missingContracts: 3, // Known from audit
        monthlyTotal,
        annualTotal: monthlyTotal * 12,
        complianceRate: Math.round(complianceRate),
        potentialNonDeductible: knownMissingMonthly * 12, // Annual non-deductible risk
      });

      // Build expiration alerts
      const alerts: ExpirationAlert[] = [];
      for (const contract of activeContracts) {
        if (!contract.end_date) continue;
        
        const endDate = new Date(contract.end_date);
        const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
          alerts.push({
            contractId: contract.id,
            title: contract.title,
            providerName: contract.provider_name,
            endDate: contract.end_date,
            daysUntilExpiration: daysUntil,
            alertType: 'expired',
          });
        } else if (daysUntil <= 7) {
          alerts.push({
            contractId: contract.id,
            title: contract.title,
            providerName: contract.provider_name,
            endDate: contract.end_date,
            daysUntilExpiration: daysUntil,
            alertType: 'expiring_7',
          });
        } else if (daysUntil <= 30) {
          alerts.push({
            contractId: contract.id,
            title: contract.title,
            providerName: contract.provider_name,
            endDate: contract.end_date,
            daysUntilExpiration: daysUntil,
            alertType: 'expiring_30',
          });
        }
      }
      
      setExpirationAlerts(alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration));
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchSuppliers();
  }, [fetchContracts, fetchSuppliers]);

  const hasActiveContractForSupplier = useCallback((fournisseurId: string): boolean => {
    return contracts.some(c => c.fournisseur_id === fournisseurId && c.is_active);
  }, [contracts]);

  const getContractForSupplier = useCallback((fournisseurId: string): Contract | undefined => {
    return contracts.find(c => c.fournisseur_id === fournisseurId && c.is_active);
  }, [contracts]);

  const validatePaymentAgainstContract = useCallback((
    fournisseurId: string | null,
    amount: number
  ): { 
    hasContract: boolean; 
    contract?: Contract; 
    variance?: number; 
    variancePercent?: number;
    isOverpayment?: boolean;
  } => {
    if (!fournisseurId) {
      return { hasContract: false };
    }

    const contract = contracts.find(c => c.fournisseur_id === fournisseurId && c.is_active);
    if (!contract) {
      return { hasContract: false };
    }

    const variance = amount - contract.monthly_amount;
    const variancePercent = (variance / contract.monthly_amount) * 100;

    return {
      hasContract: true,
      contract,
      variance,
      variancePercent,
      isOverpayment: variancePercent > 5,
    };
  }, [contracts]);

  return {
    contracts,
    stats,
    expirationAlerts,
    suppliers,
    loading,
    refresh: fetchContracts,
    hasActiveContractForSupplier,
    getContractForSupplier,
    validatePaymentAgainstContract,
  };
}
