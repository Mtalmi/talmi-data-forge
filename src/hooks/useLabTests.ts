import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';

interface LabTest {
  id: string;
  bl_id: string;
  formule_id: string;
  date_prelevement: string;
  date_test_7j: string;
  date_test_28j: string;
  affaissement_mm: number | null;
  affaissement_conforme: boolean | null;
  resistance_7j_mpa: number | null;
  resistance_28j_mpa: number | null;
  resistance_conforme: boolean | null;
  technicien_prelevement: string | null;
  technicien_test: string | null;
  notes: string | null;
  alerte_qualite: boolean;
  created_at: string;
}

interface TestCalendarItem {
  id: string;
  bl_id: string;
  client_id: string;
  formule_id: string;
  test_type: '7j' | '28j';
  test_date: string;
  is_completed: boolean;
  resistance_value: number | null;
  is_overdue: boolean;
  is_today: boolean;
  is_upcoming: boolean;
}

interface SlumpValidation {
  isValid: boolean;
  deviation: number;
  message: string;
}

export function useLabTests() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendar, setCalendar] = useState<TestCalendarItem[]>([]);

  const fetchTests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tests_laboratoire')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
      buildCalendar(data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Erreur lors du chargement des tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildCalendar = async (testsData: LabTest[]) => {
    try {
      // Get BL info for each test
      const blIds = testsData.map(t => t.bl_id);
      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, client_id')
        .in('bl_id', blIds);

      const blMap = new Map(bls?.map(bl => [bl.bl_id, bl.client_id]) || []);

      const calendarItems: TestCalendarItem[] = [];

      testsData.forEach(test => {
        const clientId = blMap.get(test.bl_id) || 'N/A';

        // 7-day test
        const date7j = new Date(test.date_test_7j);
        calendarItems.push({
          id: `${test.id}-7j`,
          bl_id: test.bl_id,
          client_id: clientId,
          formule_id: test.formule_id,
          test_type: '7j',
          test_date: test.date_test_7j,
          is_completed: test.resistance_7j_mpa !== null,
          resistance_value: test.resistance_7j_mpa,
          is_overdue: isPast(date7j) && test.resistance_7j_mpa === null && !isToday(date7j),
          is_today: isToday(date7j),
          is_upcoming: isFuture(date7j) || isTomorrow(date7j),
        });

        // 28-day test
        const date28j = new Date(test.date_test_28j);
        calendarItems.push({
          id: `${test.id}-28j`,
          bl_id: test.bl_id,
          client_id: clientId,
          formule_id: test.formule_id,
          test_type: '28j',
          test_date: test.date_test_28j,
          is_completed: test.resistance_28j_mpa !== null,
          resistance_value: test.resistance_28j_mpa,
          is_overdue: isPast(date28j) && test.resistance_28j_mpa === null && !isToday(date28j),
          is_today: isToday(date28j),
          is_upcoming: isFuture(date28j) || isTomorrow(date28j),
        });
      });

      // Sort by date
      calendarItems.sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
      setCalendar(calendarItems);
    } catch (error) {
      console.error('Error building calendar:', error);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const validateSlump = useCallback(async (
    formuleId: string, 
    measuredSlump: number
  ): Promise<SlumpValidation> => {
    try {
      const { data: formule, error } = await supabase
        .from('formules_theoriques')
        .select('affaissement_cible_mm, affaissement_tolerance_mm')
        .eq('formule_id', formuleId)
        .single();

      if (error || !formule) {
        return { isValid: true, deviation: 0, message: 'Formule non trouvée' };
      }

      const target = formule.affaissement_cible_mm || 150;
      const tolerance = formule.affaissement_tolerance_mm || 20;
      const deviation = measuredSlump - target;
      const isValid = Math.abs(deviation) <= tolerance;

      return {
        isValid,
        deviation,
        message: isValid 
          ? `Conforme (${deviation >= 0 ? '+' : ''}${deviation}mm)`
          : `Hors Tolérance - Ajustement Requis (${deviation >= 0 ? '+' : ''}${deviation}mm vs ±${tolerance}mm)`,
      };
    } catch (error) {
      console.error('Error validating slump:', error);
      return { isValid: true, deviation: 0, message: 'Erreur validation' };
    }
  }, []);

  const createTest = useCallback(async (
    blId: string,
    formuleId: string,
    affaissement: number,
    technicien?: string
  ): Promise<boolean> => {
    try {
      // Validate slump first
      const validation = await validateSlump(formuleId, affaissement);

      const { error } = await supabase
        .from('tests_laboratoire')
        .insert([{
          bl_id: blId,
          formule_id: formuleId,
          affaissement_mm: affaissement,
          affaissement_conforme: validation.isValid,
          technicien_prelevement: technicien,
        }]);

      if (error) throw error;

      // Also update the BL with slump data
      await supabase
        .from('bons_livraison_reels')
        .update({
          affaissement_mm: affaissement,
          affaissement_conforme: validation.isValid,
        })
        .eq('bl_id', blId);

      toast.success('Prélèvement enregistré');
      fetchTests();
      return true;
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  }, [validateSlump, fetchTests]);

  const updateResistance = useCallback(async (
    testId: string,
    type: '7j' | '28j',
    value: number,
    technicien?: string
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        technicien_test: technicien,
      };

      if (type === '7j') {
        updateData.resistance_7j_mpa = value;
      } else {
        updateData.resistance_28j_mpa = value;
      }

      const { error } = await supabase
        .from('tests_laboratoire')
        .update(updateData)
        .eq('id', testId);

      if (error) throw error;

      toast.success(`Résistance ${type} enregistrée`);
      fetchTests();
      return true;
    } catch (error) {
      console.error('Error updating resistance:', error);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  }, [fetchTests]);

  const getClientTests = useCallback(async (clientId: string): Promise<LabTest[]> => {
    try {
      // First get all BLs for this client
      const { data: bls, error: blError } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .eq('client_id', clientId);

      if (blError) throw blError;

      const blIds = bls?.map(bl => bl.bl_id) || [];
      
      if (blIds.length === 0) return [];

      // Then get all tests for these BLs
      const { data: testsData, error } = await supabase
        .from('tests_laboratoire')
        .select('*')
        .in('bl_id', blIds)
        .order('date_prelevement', { ascending: false });

      if (error) throw error;
      return testsData || [];
    } catch (error) {
      console.error('Error fetching client tests:', error);
      return [];
    }
  }, []);

  const getPendingTests = useCallback(() => {
    return calendar.filter(item => 
      !item.is_completed && (item.is_today || item.is_overdue)
    );
  }, [calendar]);

  const getUpcomingTests = useCallback(() => {
    return calendar.filter(item => 
      !item.is_completed && item.is_upcoming
    ).slice(0, 10);
  }, [calendar]);

  return {
    tests,
    loading,
    calendar,
    validateSlump,
    createTest,
    updateResistance,
    getClientTests,
    getPendingTests,
    getUpcomingTests,
    refresh: fetchTests,
  };
}
