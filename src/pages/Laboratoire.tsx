import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WorldClassLaboratory from '@/components/laboratory/WorldClassLaboratory';
import { AIAnalysisSection } from '@/components/laboratory/AIAnalysisSection';
import { FormulaOptimizationCard } from '@/components/laboratory/FormulaOptimizationCard';
import { RegulatoryComplianceCard } from '@/components/laboratory/RegulatoryComplianceCard';
import { OperatorPerformanceSection } from '@/components/laboratory/OperatorPerformanceSection';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { useLabTests } from '@/hooks/useLabTests';
import { TestCalendar } from '@/components/lab/TestCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SlumpEntry } from '@/components/lab/SlumpEntry';
import { useEffect } from 'react';

interface Formule {
  formule_id: string;
  designation: string;
  affaissement_cible_mm: number | null;
  affaissement_tolerance_mm: number | null;
  resistance_cible_28j_mpa: number | null;
}

interface BonLivraison {
  bl_id: string;
  client_id: string;
  formule_id: string;
  date_livraison: string;
  volume_m3: number;
}

export default function Laboratoire() {
  const { isCeo, isResponsableTechnique, isCentraliste } = useAuth();
  const { t, lang } = useI18n();
  const { tests, loading, calendar, createTest, updateResistance, getPendingTests, refresh } = useLabTests();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [selectedBl, setSelectedBl] = useState('');
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(null);
  const [slumpValue, setSlumpValue] = useState(0);
  const [slumpValid, setSlumpValid] = useState(true);
  const [technicien, setTechnicien] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = isCeo || isResponsableTechnique || isCentraliste;
  const pendingTests = getPendingTests();

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [formulesRes, bonsRes] = await Promise.all([
        supabase
          .from('formules_theoriques')
          .select('formule_id, designation, affaissement_cible_mm, affaissement_tolerance_mm, resistance_cible_28j_mpa'),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id, formule_id, date_livraison, volume_m3')
          .in('workflow_status', ['production', 'validation_technique', 'en_livraison', 'livre'])
          .order('date_livraison', { ascending: false })
          .limit(50),
      ]);

      if (formulesRes.error) throw formulesRes.error;
      if (bonsRes.error) throw bonsRes.error;

      setFormules(formulesRes.data || []);
      setBons(bonsRes.data || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleBlSelect = (blId: string) => {
    setSelectedBl(blId);
    const bon = bons.find(b => b.bl_id === blId);
    if (bon) {
      const formule = formules.find(f => f.formule_id === bon.formule_id);
      setSelectedFormule(formule || null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBl || !slumpValue) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!slumpValid) {
      toast.warning('Attention: L\'affaissement est hors tolérance');
    }

    setSaving(true);
    const bon = bons.find(b => b.bl_id === selectedBl);
    const success = await createTest(
      selectedBl,
      bon?.formule_id || '',
      slumpValue,
      technicien || undefined
    );
    setSaving(false);

    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedBl('');
    setSelectedFormule(null);
    setSlumpValue(0);
    setTechnicien('');
    setSlumpValid(true);
  };

  const handleRecordResult = async (testId: string, type: '7j' | '28j', value: number): Promise<boolean> => {
    return updateResistance(testId, type, value);
  };

  // Quality stats
  const qualityStats = {
    totalTests: tests.length,
    slumpConform: tests.filter(t => t.affaissement_conforme === true).length,
    resistanceConform: tests.filter(t => t.resistance_conforme === true).length,
    pendingResistance: tests.filter(t => t.resistance_28j_mpa === null).length,
    alerts: tests.filter(t => t.alerte_qualite === true).length,
  };

  return (
    <MainLayout>
      {/* ══ Premium Lab UI ══ */}
      <WorldClassLaboratory />
      {/* 🤖 AI Quality Analysis */}
      <div style={{ width: '100%', padding: '24px 24px 0' }}>
        <AIAnalysisSection />
      </div>
      {/* 🧪 AI Formula Optimization */}
      <div style={{ width: '100%', padding: '24px 24px 0' }}>
        <FormulaOptimizationCard />
      </div>
      {/* 🛡️ AI Regulatory Compliance */}
      <div style={{ width: '100%', padding: '24px 24px 0' }}>
        <RegulatoryComplianceCard />
      </div>
      {/* 🧑‍🔬 Performance Opérateurs IA */}
      <div style={{ width: '100%', padding: '24px 24px 0' }}>
        <OperatorPerformanceSection />
      </div>
      {/* Legacy section removed — WorldClassLaboratory is the primary UI */}
    </MainLayout>
  );
}
