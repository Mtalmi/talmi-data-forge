import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employe {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  role: string;
  telephone: string | null;
  actif: boolean;
}

interface Pointage {
  id: string;
  employe_id: string;
  date_pointage: string;
  heure_entree: string | null;
  heure_sortie: string | null;
  source: string;
  valide: boolean;
  valide_par: string | null;
  notes: string | null;
  employe?: Employe;
}

interface RapportJournalier {
  id: string;
  employe_id: string;
  date_rapport: string;
  taches_completees: string;
  taches_en_cours: string | null;
  problemes_rencontres: string | null;
  materiaux_utilises: Record<string, unknown> | null;
  observations: string | null;
  valide: boolean;
  soumis_at: string;
  employe?: Employe;
}

export function usePointage() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [rapports, setRapports] = useState<RapportJournalier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employes')
        .select('*')
        .eq('actif', true)
        .order('nom');

      if (error) throw error;
      setEmployes(data || []);
    } catch (error) {
      console.error('Error fetching employes:', error);
    }
  }, []);

  const fetchPointages = useCallback(async (date?: string) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('pointages')
        .select('*, employe:employes(*)')
        .eq('date_pointage', targetDate)
        .order('heure_entree', { ascending: true });

      if (error) throw error;
      setPointages((data || []) as unknown as Pointage[]);
    } catch (error) {
      console.error('Error fetching pointages:', error);
    }
  }, []);

  const fetchRapports = useCallback(async (date?: string) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('rapports_journaliers')
        .select('*, employe:employes(*)')
        .eq('date_rapport', targetDate)
        .order('soumis_at', { ascending: false });

      if (error) throw error;
      setRapports((data || []) as unknown as RapportJournalier[]);
    } catch (error) {
      console.error('Error fetching rapports:', error);
    }
  }, []);

  // Clock in function
  const clockIn = useCallback(async (employeId: string, source: 'mobile' | 'bureau' = 'mobile'): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already clocked in today
      const { data: existing } = await supabase
        .from('pointages')
        .select('id, heure_entree')
        .eq('employe_id', employeId)
        .eq('date_pointage', today)
        .single();

      if (existing?.heure_entree) {
        toast.error('Déjà pointé aujourd\'hui');
        return false;
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('pointages')
          .update({
            heure_entree: new Date().toISOString(),
            source,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('pointages')
          .insert({
            employe_id: employeId,
            date_pointage: today,
            heure_entree: new Date().toISOString(),
            source,
          });

        if (error) throw error;
      }

      toast.success('Pointage d\'entrée enregistré');
      await fetchPointages();
      return true;
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Erreur lors du pointage');
      return false;
    }
  }, [fetchPointages]);

  // Clock out function
  const clockOut = useCallback(async (employeId: string): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await supabase
        .from('pointages')
        .select('id, heure_entree, heure_sortie')
        .eq('employe_id', employeId)
        .eq('date_pointage', today)
        .single();

      if (!existing) {
        toast.error('Aucun pointage d\'entrée trouvé');
        return false;
      }

      if (existing.heure_sortie) {
        toast.error('Déjà pointé la sortie');
        return false;
      }

      const { error } = await supabase
        .from('pointages')
        .update({
          heure_sortie: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;

      toast.success('Pointage de sortie enregistré');
      await fetchPointages();
      return true;
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Erreur lors du pointage');
      return false;
    }
  }, [fetchPointages]);

  // Submit daily report
  const submitRapport = useCallback(async (
    employeId: string,
    tachesCompletees: string,
    tachesEnCours?: string,
    problemesRencontres?: string,
    observations?: string
  ): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already submitted today
      const { data: existing } = await supabase
        .from('rapports_journaliers')
        .select('id')
        .eq('employe_id', employeId)
        .eq('date_rapport', today)
        .single();

      if (existing) {
        toast.error('Rapport déjà soumis aujourd\'hui');
        return false;
      }

      const { error } = await supabase
        .from('rapports_journaliers')
        .insert({
          employe_id: employeId,
          date_rapport: today,
          taches_completees: tachesCompletees,
          taches_en_cours: tachesEnCours || null,
          problemes_rencontres: problemesRencontres || null,
          observations: observations || null,
        });

      if (error) throw error;

      toast.success('Rapport journalier soumis');
      await fetchRapports();
      return true;
    } catch (error) {
      console.error('Error submitting rapport:', error);
      toast.error('Erreur lors de la soumission');
      return false;
    }
  }, [fetchRapports]);

  // Add new employee
  const addEmploye = useCallback(async (
    nom: string,
    prenom: string,
    role: string,
    telephone?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('employes')
        .insert({
          nom,
          prenom,
          role,
          telephone: telephone || null,
        });

      if (error) throw error;

      toast.success('Employé ajouté');
      await fetchEmployes();
      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Erreur lors de l\'ajout');
      return false;
    }
  }, [fetchEmployes]);

  // Validate pointage
  const validatePointage = useCallback(async (pointageId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pointages')
        .update({
          valide: true,
          valide_par: userId,
          valide_at: new Date().toISOString(),
        })
        .eq('id', pointageId);

      if (error) throw error;

      toast.success('Pointage validé');
      await fetchPointages();
      return true;
    } catch (error) {
      console.error('Error validating pointage:', error);
      toast.error('Erreur lors de la validation');
      return false;
    }
  }, [fetchPointages]);

  // Get today's pointage for an employee
  const getTodayPointage = useCallback((employeId: string): Pointage | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return pointages.find(p => p.employe_id === employeId && p.date_pointage === today);
  }, [pointages]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployes(),
        fetchPointages(),
        fetchRapports(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployes, fetchPointages, fetchRapports]);

  return {
    employes,
    pointages,
    rapports,
    loading,
    fetchEmployes,
    fetchPointages,
    fetchRapports,
    clockIn,
    clockOut,
    submitRapport,
    addEmploye,
    validatePointage,
    getTodayPointage,
  };
}
