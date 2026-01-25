import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type AssetCategory = 'batiments' | 'vehicules' | 'equipements' | 'mobilier' | 'informatique' | 'outils' | 'autre';
export type DepreciationMethod = 'linear' | 'accelerated' | 'units_of_production';
export type AssetStatus = 'new' | 'active' | 'maintenance' | 'inactive' | 'pending_disposal' | 'disposed';

export interface FixedAsset {
  id: string;
  asset_id: string;
  category: AssetCategory;
  description: string;
  serial_number: string | null;
  barcode: string | null;
  purchase_date: string;
  purchase_price: number;
  supplier_id: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  location: string;
  responsible_person: string | null;
  warranty_end_date: string | null;
  warranty_certificate_url: string | null;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  residual_value: number;
  depreciation_start_date: string;
  accumulated_depreciation: number;
  net_book_value: number;
  monthly_depreciation: number;
  status: AssetStatus;
  photos: string[];
  documents: string[];
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_at: string;
  // Joined data
  fournisseurs?: { nom: string } | null;
}

export interface DepreciationScheduleEntry {
  id: string;
  asset_id: string;
  period_date: string;
  period_number: number;
  depreciation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
  is_posted: boolean;
  posted_at: string | null;
}

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  maintenance_date: string;
  maintenance_type: string;
  description: string | null;
  cost: number;
  performed_by: string | null;
  next_maintenance_date: string | null;
  next_maintenance_type: string | null;
  invoice_url: string | null;
  photos: string[];
  created_at: string;
  created_by_name: string | null;
}

export interface AssetDisposal {
  id: string;
  asset_id: string;
  disposal_date: string;
  disposal_type: string;
  disposal_reason: string | null;
  net_book_value_at_disposal: number;
  disposal_price: number;
  gain_loss: number;
  buyer_name: string | null;
  buyer_contact: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface AssetSummary {
  category: AssetCategory;
  asset_count: number;
  gross_value: number;
  accumulated_depreciation: number;
  net_value: number;
}

export interface CreateAssetInput {
  category: AssetCategory;
  description: string;
  serial_number?: string;
  barcode?: string;
  purchase_date: string;
  purchase_price: number;
  supplier_id?: string;
  invoice_number?: string;
  invoice_url?: string;
  location: string;
  responsible_person?: string;
  warranty_end_date?: string;
  warranty_certificate_url?: string;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  residual_value: number;
  depreciation_start_date?: string;
  photos?: string[];
  documents?: string[];
}

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  batiments: 'Bâtiments',
  vehicules: 'Véhicules',
  equipements: 'Équipements',
  mobilier: 'Mobilier',
  informatique: 'Informatique',
  outils: 'Outils',
  autre: 'Autre',
};

export const CATEGORY_USEFUL_LIFE: Record<AssetCategory, number> = {
  batiments: 240, // 20 years
  vehicules: 60,  // 5 years
  equipements: 84, // 7 years
  mobilier: 120,   // 10 years
  informatique: 36, // 3 years
  outils: 60,      // 5 years
  autre: 60,       // 5 years default
};

export const STATUS_LABELS: Record<AssetStatus, string> = {
  new: 'Nouveau',
  active: 'Actif',
  maintenance: 'En Maintenance',
  inactive: 'Inactif',
  pending_disposal: 'Cession en Cours',
  disposed: 'Cédé',
};

export const DEPRECIATION_METHOD_LABELS: Record<DepreciationMethod, string> = {
  linear: 'Linéaire',
  accelerated: 'Dégressif',
  units_of_production: 'Unités de Production',
};

export function useFixedAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('fixed_assets')
        .select(`
          *,
          fournisseurs(nom)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAssets((data || []) as unknown as FixedAsset[]);
    } catch (err: any) {
      console.error('Error fetching fixed assets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_fixed_assets_summary');

      if (fetchError) throw fetchError;
      setSummary((data || []) as AssetSummary[]);
    } catch (err: any) {
      console.error('Error fetching asset summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchSummary();
  }, [fetchAssets, fetchSummary]);

  const checkDuplicate = async (
    serialNumber: string | null,
    purchaseDate: string,
    supplierId: string | null,
    purchasePrice: number,
    category: AssetCategory,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; duplicateAssetId?: string; matchType?: string }> => {
    try {
      const { data, error } = await supabase.rpc('check_duplicate_asset', {
        p_serial_number: serialNumber,
        p_purchase_date: purchaseDate,
        p_supplier_id: supplierId,
        p_purchase_price: purchasePrice,
        p_category: category,
        p_exclude_id: excludeId || null,
      });

      if (error) throw error;
      
      if (data && data.length > 0 && data[0].is_duplicate) {
        return {
          isDuplicate: true,
          duplicateAssetId: data[0].duplicate_asset_id,
          matchType: data[0].match_type,
        };
      }
      return { isDuplicate: false };
    } catch (err) {
      console.error('Error checking duplicate:', err);
      return { isDuplicate: false };
    }
  };

  const createAsset = async (input: CreateAssetInput): Promise<FixedAsset | null> => {
    try {
      // Check for duplicates first
      const duplicateCheck = await checkDuplicate(
        input.serial_number || null,
        input.purchase_date,
        input.supplier_id || null,
        input.purchase_price,
        input.category
      );

      if (duplicateCheck.isDuplicate) {
        toast.error(`Doublon détecté: ${duplicateCheck.duplicateAssetId}`, {
          description: duplicateCheck.matchType === 'serial_number' 
            ? 'Un actif avec ce numéro de série existe déjà'
            : 'Un actif similaire (même date, fournisseur, montant) existe déjà',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('fixed_assets')
        .insert({
          ...input,
          asset_id: '', // Will be auto-generated by trigger
          depreciation_start_date: input.depreciation_start_date || input.purchase_date,
          net_book_value: input.purchase_price, // Will be set by trigger
          monthly_depreciation: 0, // Will be calculated by trigger
          created_by: user?.id,
          created_by_name: user?.email,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Immobilisation créée', {
        description: `${(data as any).asset_id} - ${input.description}`,
      });

      await fetchAssets();
      await fetchSummary();
      return data as unknown as FixedAsset;
    } catch (err: any) {
      console.error('Error creating asset:', err);
      toast.error('Erreur lors de la création', { description: err.message });
      return null;
    }
  };

  const updateAsset = async (id: string, updates: Partial<CreateAssetInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fixed_assets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
          updated_by_name: user?.email,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Immobilisation mise à jour');
      await fetchAssets();
      await fetchSummary();
      return true;
    } catch (err: any) {
      console.error('Error updating asset:', err);
      toast.error('Erreur lors de la mise à jour', { description: err.message });
      return false;
    }
  };

  const updateAssetStatus = async (id: string, status: AssetStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fixed_assets')
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
          updated_by_name: user?.email,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Statut mis à jour: ${STATUS_LABELS[status]}`);
      await fetchAssets();
      return true;
    } catch (err: any) {
      console.error('Error updating asset status:', err);
      toast.error('Erreur lors de la mise à jour du statut', { description: err.message });
      return false;
    }
  };

  const getDepreciationSchedule = async (assetId: string): Promise<DepreciationScheduleEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('asset_depreciation_schedule')
        .select('*')
        .eq('asset_id', assetId)
        .order('period_number', { ascending: true });

      if (error) throw error;
      return (data || []) as DepreciationScheduleEntry[];
    } catch (err) {
      console.error('Error fetching depreciation schedule:', err);
      return [];
    }
  };

  const getMaintenanceRecords = async (assetId: string): Promise<AssetMaintenance[]> => {
    try {
      const { data, error } = await supabase
        .from('asset_maintenance')
        .select('*')
        .eq('asset_id', assetId)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      return (data || []) as AssetMaintenance[];
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      return [];
    }
  };

  const addMaintenanceRecord = async (
    assetId: string,
    maintenance: {
      maintenance_date: string;
      maintenance_type: string;
      description?: string;
      cost: number;
      performed_by?: string;
      next_maintenance_date?: string;
      next_maintenance_type?: string;
      invoice_url?: string;
      photos?: string[];
    }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asset_maintenance')
        .insert({
          asset_id: assetId,
          ...maintenance,
          created_by: user?.id,
          created_by_name: user?.email,
        });

      if (error) throw error;

      toast.success('Maintenance enregistrée');
      return true;
    } catch (err: any) {
      console.error('Error adding maintenance record:', err);
      toast.error('Erreur lors de l\'enregistrement', { description: err.message });
      return false;
    }
  };

  const disposeAsset = async (
    assetId: string,
    disposal: {
      disposal_date: string;
      disposal_type: string;
      disposal_reason?: string;
      disposal_price?: number;
      buyer_name?: string;
      buyer_contact?: string;
      invoice_url?: string;
    }
  ): Promise<boolean> => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Actif non trouvé');

      const disposalPrice = disposal.disposal_price || 0;
      const gainLoss = disposalPrice - asset.net_book_value;

      // Create disposal record
      const { error: disposalError } = await supabase
        .from('asset_disposals')
        .insert({
          asset_id: assetId,
          disposal_date: disposal.disposal_date,
          disposal_type: disposal.disposal_type,
          disposal_reason: disposal.disposal_reason,
          net_book_value_at_disposal: asset.net_book_value,
          disposal_price: disposalPrice,
          gain_loss: gainLoss,
          buyer_name: disposal.buyer_name,
          buyer_contact: disposal.buyer_contact,
          invoice_url: disposal.invoice_url,
          approved_by: user?.id,
          approved_by_name: user?.email,
          approved_at: new Date().toISOString(),
          created_by: user?.id,
          created_by_name: user?.email,
        });

      if (disposalError) throw disposalError;

      // Update asset status
      const { error: updateError } = await supabase
        .from('fixed_assets')
        .update({
          status: 'disposed' as AssetStatus,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
          updated_by_name: user?.email,
        })
        .eq('id', assetId);

      if (updateError) throw updateError;

      const gainLossText = gainLoss >= 0 ? `Plus-value: ${gainLoss.toLocaleString()} DH` : `Moins-value: ${Math.abs(gainLoss).toLocaleString()} DH`;
      toast.success('Cession enregistrée', { description: gainLossText });

      await fetchAssets();
      await fetchSummary();
      return true;
    } catch (err: any) {
      console.error('Error disposing asset:', err);
      toast.error('Erreur lors de la cession', { description: err.message });
      return false;
    }
  };

  // Calculate totals
  const totals = {
    grossValue: assets.filter(a => a.status !== 'disposed').reduce((sum, a) => sum + a.purchase_price, 0),
    accumulatedDepreciation: assets.filter(a => a.status !== 'disposed').reduce((sum, a) => sum + a.accumulated_depreciation, 0),
    netBookValue: assets.filter(a => a.status !== 'disposed').reduce((sum, a) => sum + a.net_book_value, 0),
    assetCount: assets.filter(a => a.status !== 'disposed').length,
    monthlyDepreciation: assets.filter(a => a.status !== 'disposed' && a.status !== 'pending_disposal').reduce((sum, a) => sum + a.monthly_depreciation, 0),
  };

  return {
    assets,
    summary,
    loading,
    error,
    totals,
    fetchAssets,
    fetchSummary,
    createAsset,
    updateAsset,
    updateAssetStatus,
    getDepreciationSchedule,
    getMaintenanceRecords,
    addMaintenanceRecord,
    disposeAsset,
    checkDuplicate,
  };
}
