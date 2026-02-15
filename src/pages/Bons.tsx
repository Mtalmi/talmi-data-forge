import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { useBonWorkflow } from '@/hooks/useBonWorkflow';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { BonDetailDialog } from '@/components/bons/BonDetailDialog';
import { BlPrintable } from '@/components/bons/BlPrintable';
import { ExportButton } from '@/components/documents/ExportButton';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { DriverDispatchCard } from '@/components/planning/DriverDispatchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Truck, Loader2, AlertCircle, CheckCircle, Clock, Play, Package, FileText, XCircle, Eye, Printer, List, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BonLivraison {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  eau_reel_l: number | null;
  km_parcourus: number | null;
  temps_mission_heures: number | null;
  statut_paiement: string;
  workflow_status: string | null;
  toupie_assignee: string | null;
  validation_technique: boolean | null;
  alerte_ecart: boolean;
  alerte_marge: boolean | null;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  created_at: string;
  // Logistics & Payment fields
  zone_livraison_id: string | null;
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  prestataire_id: string | null;
}

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
}

interface Client {
  client_id: string;
  nom_client: string;
  limite_credit_dh: number | null;
  solde_du: number | null;
}

const WORKFLOW_STEPS = [
  { value: 'planification', label: 'Planification', icon: Clock, color: 'text-muted-foreground' },
  { value: 'production', label: 'Production', icon: Play, color: 'text-warning' },
  { value: 'validation_technique', label: 'Validation Tech.', icon: CheckCircle, color: 'text-purple-500' },
  { value: 'en_livraison', label: 'En Livraison', icon: Truck, color: 'text-blue-500' },
  { value: 'livre', label: 'Livré', icon: Package, color: 'text-success' },
  { value: 'facture', label: 'Facturé', icon: FileText, color: 'text-primary' },
  { value: 'annule', label: 'Annulé', icon: XCircle, color: 'text-destructive' },
];

export default function Bons() {
  const { user, isCeo, isAgentAdministratif, isDirecteurOperations, isCentraliste, isResponsableTechnique, isSuperviseur, canCreateBons, canValidateTechnique } = useAuth();
  const { t } = useI18n();
  const { transitionWorkflow, canTransitionTo } = useBonWorkflow();
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
  const [searchParams] = useSearchParams();

  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toleranceErrors, setToleranceErrors] = useState<string[]>([]);
  const [detailBlId, setDetailBlId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile || isTablet ? 'cards' : 'table');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check for URL params to open detail
  useEffect(() => {
    const blParam = searchParams.get('bl');
    if (blParam) {
      setDetailBlId(blParam);
      setDetailDialogOpen(true);
    }
  }, [searchParams]);

  // Form state
  const [blId, setBlId] = useState('');
  const [clientId, setClientId] = useState('');
  const [formuleId, setFormuleId] = useState('');
  const [volume, setVolume] = useState('');
  const [cimentReel, setCimentReel] = useState('');
  const [adjuvantReel, setAdjuvantReel] = useState('');
  const [eauReel, setEauReel] = useState('');
  const [kmParcourus, setKmParcourus] = useState('');
  const [tempsMission, setTempsMission] = useState('');
  const [toupie, setToupie] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [bonsRes, formulesRes, clientsRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('*').order('created_at', { ascending: false }),
        supabase.from('formules_theoriques').select('formule_id, designation, ciment_kg_m3, adjuvant_l_m3'),
        supabase.from('clients').select('client_id, nom_client, limite_credit_dh, solde_du'),
      ]);

      if (bonsRes.error) throw bonsRes.error;
      if (formulesRes.error) throw formulesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setBons(bonsRes.data || []);
      setFormules(formulesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t.pages.bons.createError);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pull to refresh for mobile
  const handlePullRefresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: !isMobile && !isTablet,
  });

  const generateBlId = () => {
    const today = new Date();
    const dateStr = format(today, 'yyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TB-${dateStr}-${random}`;
  };

  const resetForm = () => {
    setBlId(generateBlId());
    setClientId('');
    setFormuleId('');
    setVolume('');
    setCimentReel('');
    setAdjuvantReel('');
    setEauReel('');
    setKmParcourus('');
    setTempsMission('');
    setToupie('');
    setToleranceErrors([]);
  };

  useEffect(() => {
    if (dialogOpen) {
      resetForm();
    }
  }, [dialogOpen]);

  const validateTolerances = () => {
    const errors: string[] = [];
    const selectedFormule = formules.find(f => f.formule_id === formuleId);
    
    if (!selectedFormule || !volume) return errors;

    const volumeNum = parseFloat(volume);
    const cimentTheorique = selectedFormule.ciment_kg_m3 * volumeNum;
    const adjuvantTheorique = selectedFormule.adjuvant_l_m3 * volumeNum;
    const cimentReelNum = parseFloat(cimentReel) || 0;
    const adjuvantReelNum = parseFloat(adjuvantReel) || 0;

    // Cement ±2%
    const cimentEcart = Math.abs((cimentReelNum - cimentTheorique) / cimentTheorique) * 100;
    if (cimentReelNum > 0 && cimentEcart > 2) {
      errors.push(`Ciment hors tolérance: ${cimentEcart.toFixed(1)}% (max ±2%)`);
    }

    // Adjuvant ±5%
    if (adjuvantTheorique > 0) {
      const adjuvantEcart = Math.abs((adjuvantReelNum - adjuvantTheorique) / adjuvantTheorique) * 100;
      if (adjuvantReelNum > 0 && adjuvantEcart > 5) {
        errors.push(`Adjuvant hors tolérance: ${adjuvantEcart.toFixed(1)}% (max ±5%)`);
      }
    }

    return errors;
  };

  useEffect(() => {
    if (formuleId && volume && cimentReel) {
      setToleranceErrors(validateTolerances());
    }
  }, [formuleId, volume, cimentReel, adjuvantReel]);

  const checkCreditLimit = () => {
    const selectedClient = clients.find(c => c.client_id === clientId);
    if (!selectedClient) return null;

    const solde = selectedClient.solde_du || 0;
    const limite = selectedClient.limite_credit_dh || 50000;

    if (solde > limite) {
      return { exceeded: true, solde, limite };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const volumeNum = parseFloat(volume);
      if (volumeNum <= 0 || volumeNum >= 12) {
        toast.error('Volume doit être entre 0 et 12 m³');
        setSubmitting(false);
        return;
      }

      // Check credit limit
      const creditCheck = checkCreditLimit();
      if (creditCheck?.exceeded) {
        // Create approval request
        await supabase.from('approbations_ceo').insert([{
          type_approbation: 'credit',
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          demande_par: user?.id,
          montant: creditCheck.solde,
          details: { limite: creditCheck.limite, client_id: clientId },
        }]);

        // Create alert
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'credit',
          niveau: 'critical',
          titre: 'Dépassement Limite Crédit',
          message: `Client ${clientId} a dépassé sa limite de crédit (${creditCheck.solde.toLocaleString()} / ${creditCheck.limite.toLocaleString()} DH)`,
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);

        toast.warning('Demande d\'approbation crédit envoyée au CEO');
      }

      const errors = validateTolerances();
      const hasAlerte = errors.length > 0;

      const { error } = await supabase.from('bons_livraison_reels').insert([{
        bl_id: blId,
        client_id: clientId,
        formule_id: formuleId,
        volume_m3: volumeNum,
        ciment_reel_kg: parseFloat(cimentReel) || 0,
        adjuvant_reel_l: adjuvantReel ? parseFloat(adjuvantReel) : null,
        eau_reel_l: eauReel ? parseFloat(eauReel) : null,
        km_parcourus: kmParcourus ? parseFloat(kmParcourus) : null,
        temps_mission_heures: tempsMission ? parseFloat(tempsMission) : null,
        statut_paiement: 'En Attente',
        workflow_status: 'planification',
        toupie_assignee: toupie || null,
        alerte_ecart: hasAlerte,
        created_by: user?.id,
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Ce bon de livraison existe déjà');
        } else if (error.code === '23514') {
          toast.error('Données hors limites autorisées');
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }

      // Create fuite alert if tolerance exceeded
      if (hasAlerte) {
        await supabase.from('alertes_systeme').insert([{
          type_alerte: 'fuite',
          niveau: 'warning',
          titre: 'Alerte Fuite - Tolérance Dépassée',
          message: errors.join('. '),
          reference_id: blId,
          reference_table: 'bons_livraison_reels',
          destinataire_role: 'ceo',
        }]);
        toast.warning('Bon créé avec alertes de tolérance');
      } else {
        toast.success('Bon de livraison créé');
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating bon:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const updateWorkflowStatus = async (blId: string, newStatus: string) => {
    const bon = bons.find(b => b.bl_id === blId);
    const currentStatus = bon?.workflow_status || 'planification';
    
    const success = await transitionWorkflow(blId, currentStatus, newStatus);
    if (success) {
      fetchData();
    }
  };

  const updatePaymentStatus = async (blId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ statut_paiement: newStatus })
        .eq('bl_id', blId);

      if (error) throw error;
      toast.success('Statut paiement mis à jour');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getWorkflowBadge = (status: string | null) => {
    const step = WORKFLOW_STEPS.find(s => s.value === status) || WORKFLOW_STEPS[0];
    const Icon = step.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted', step.color)}>
        <Icon className="h-3 w-3" />
        {step.label}
      </span>
    );
  };

  const getStatusPill = (status: string) => {
    const map: Record<string, string> = {
      'Payé': 'paid',
      'En Attente': 'pending',
      'Retard': 'late',
    };
    return map[status] || 'pending';
  };

  const canUpdatePayment = isCeo || isAgentAdministratif;

  // Filter bons by status
  const filteredBons = statusFilter === 'all' 
    ? bons 
    : bons.filter(b => b.workflow_status === statusFilter);

  // Mobile/Tablet Card View
  const renderCardView = () => (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className={cn(
          "w-full grid",
          isTouchDevice ? "h-14 grid-cols-4" : "h-10 grid-cols-7"
        )}>
          <TabsTrigger value="all" className={cn(isTouchDevice && "h-12 text-xs")}>
            Tous
            <Badge variant="secondary" className="ml-1 text-[10px]">{bons.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="planification" className={cn(isTouchDevice && "h-12 text-xs")}>
            📋
          </TabsTrigger>
          <TabsTrigger value="en_livraison" className={cn(isTouchDevice && "h-12 text-xs")}>
            🚚
          </TabsTrigger>
          <TabsTrigger value="livre" className={cn(isTouchDevice && "h-12 text-xs")}>
            ✅
          </TabsTrigger>
          {!isTouchDevice && (
            <>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="facture">Facturé</TabsTrigger>
              <TabsTrigger value="annule">Annulé</TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>

      {/* Cards List */}
      {filteredBons.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
             <p className="text-muted-foreground">{t.pages.bons.noBons}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBons.map((b) => (
            <DriverDispatchCard
              key={b.bl_id}
              bon={{
                bl_id: b.bl_id,
                client_id: b.client_id,
                formule_id: b.formule_id,
                volume_m3: b.volume_m3,
                workflow_status: b.workflow_status || 'planification',
                heure_prevue: null,
                camion_assigne: b.toupie_assignee,
                toupie_assignee: b.toupie_assignee,
                zone_livraison_id: b.zone_livraison_id,
                mode_paiement: b.mode_paiement,
                clients: { nom_client: clients.find(c => c.client_id === b.client_id)?.nom_client || b.client_id },
              }}
              showActions={false}
              onOpenDetails={() => {
                setDetailBlId(b.bl_id);
                setDetailDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div 
        ref={isMobile || isTablet ? containerRef : undefined}
        className={cn(
          "space-y-6",
          (isMobile || isTablet) && "overflow-y-auto"
        )}
      >
        {/* Pull to Refresh Indicator - Mobile/Tablet only */}
        {(isMobile || isTablet) && (
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            isRefreshing={isRefreshing}
            progress={progress}
          />
        )}
        <div className={cn(
          "flex gap-4",
          isTouchDevice ? "flex-col" : "flex-row items-center justify-between"
        )}>
          <div>
            <h1 className={cn(
              "font-bold tracking-tight",
              isTouchDevice ? "text-xl" : "text-2xl"
            )}>{ t.pages.bons.title }</h1>
            {!isTouchDevice && (
              <p className="text-muted-foreground mt-1">
                {t.pages.bons.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle - Only on desktop/tablet */}
            {!isMobile && (
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-9 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-9 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isTouchDevice && (
              <ExportButton
                data={bons.map(b => ({
                  bl_id: b.bl_id,
                  date: b.date_livraison,
                  client: b.client_id,
                  formule: b.formule_id,
                  volume: b.volume_m3,
                  ciment_kg: b.ciment_reel_kg,
                  workflow: b.workflow_status || 'planification',
                  paiement: b.statut_paiement,
                  cur: b.cur_reel || 0,
                  marge_pct: b.marge_brute_pct || 0,
                }))}
                columns={[
                  { key: 'bl_id', label: 'N° Bon' },
                  { key: 'date', label: 'Date' },
                  { key: 'client', label: 'Client' },
                  { key: 'formule', label: 'Formule' },
                  { key: 'volume', label: 'Volume (m³)' },
                  { key: 'ciment_kg', label: 'Ciment (kg)' },
                  { key: 'workflow', label: 'Statut' },
                  { key: 'paiement', label: 'Paiement' },
                  { key: 'cur', label: 'CUR (DH/m³)' },
                  { key: 'marge_pct', label: 'Marge (%)' },
                ]}
                filename="bons_livraison"
              />
            )}
            {/* Manual BL creation - CEO only exception */}
            {isCeo && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.pages.bons.newBon}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.pages.bons.createBon}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">N° Bon</Label>
                      <Input value={blId} onChange={(e) => setBlId(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Client</Label>
                      <Select value={clientId} onValueChange={setClientId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.client_id} value={c.client_id}>
                              {c.nom_client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Formule</Label>
                      <Select value={formuleId} onValueChange={setFormuleId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {formules.map((f) => (
                            <SelectItem key={f.formule_id} value={f.formule_id}>
                              {f.formule_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Volume (m³)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="11.9"
                        placeholder="8.5"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Toupie Assignée</Label>
                      <Input
                        placeholder="T-001"
                        value={toupie}
                        onChange={(e) => setToupie(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Ciment Réel (kg)</Label>
                      <Input
                        type="number"
                        placeholder="2975"
                        value={cimentReel}
                        onChange={(e) => setCimentReel(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Adjuvant Réel (L)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="17"
                        value={adjuvantReel}
                        onChange={(e) => setAdjuvantReel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Eau Réelle (L)</Label>
                      <Input
                        type="number"
                        placeholder="1530"
                        value={eauReel}
                        onChange={(e) => setEauReel(e.target.value)}
                      />
                    </div>
                  </div>

                  {toleranceErrors.length > 0 && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning text-sm">Alertes de Tolérance (Fuite)</p>
                          <ul className="mt-1 space-y-0.5">
                            {toleranceErrors.map((err, i) => (
                              <li key={i} className="text-xs text-foreground">{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Km Parcourus</Label>
                      <Input
                        type="number"
                        placeholder="45"
                        value={kmParcourus}
                        onChange={(e) => setKmParcourus(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Temps Mission (heures)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="8"
                        placeholder="2.5"
                        value={tempsMission}
                        onChange={(e) => setTempsMission(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer le Bon'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* Workflow Legend - Hide on mobile */}
        {!isMobile && (
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <span key={step.value} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted/50', step.color)}>
                  <Icon className="h-3 w-3" />
                  {step.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Content: Card view for mobile/tablet, Table for desktop */}
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'cards' || isMobile ? (
          renderCardView()
        ) : bons.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun bon de livraison</p>
          </div>
        ) : (
          <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>N° Bon</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="w-10">Valid.</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bons.map((b) => (
                  <TableRow key={b.bl_id} className={cn(b.alerte_ecart && 'bg-destructive/5', b.alerte_marge && 'bg-warning/5')}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {b.bl_id}
                        {b.alerte_ecart && <AlertCircle className="h-4 w-4 text-destructive" />}
                        {b.alerte_marge && <AlertCircle className="h-4 w-4 text-warning" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(b.date_livraison), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{b.client_id}</TableCell>
                    <TableCell className="font-mono text-sm">{b.formule_id}</TableCell>
                    <TableCell className="text-right">{b.volume_m3} m³</TableCell>
                    <TableCell>
                      {(isCeo || isDirecteurOperations || isResponsableTechnique) && b.workflow_status !== 'facture' && b.workflow_status !== 'annule' ? (
                        <Select
                          value={b.workflow_status || 'planification'}
                          onValueChange={(val) => updateWorkflowStatus(b.bl_id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WORKFLOW_STEPS.filter(s => s.value !== 'annule').map((step) => (
                              <SelectItem key={step.value} value={step.value}>
                                {step.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getWorkflowBadge(b.workflow_status)
                      )}
                    </TableCell>
                    <TableCell>
                      {canUpdatePayment ? (
                        <Select
                          value={b.statut_paiement}
                          onValueChange={(val) => updatePaymentStatus(b.bl_id, val)}
                        >
                          <SelectTrigger className={cn(
                            'w-[120px] h-8',
                            getStatusPill(b.statut_paiement) === 'paid' && 'border-success/50',
                            getStatusPill(b.statut_paiement) === 'late' && 'border-destructive/50'
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En Attente">En Attente</SelectItem>
                            <SelectItem value="Payé">Payé</SelectItem>
                            <SelectItem value="Retard">Retard</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={cn('status-pill', getStatusPill(b.statut_paiement))}>
                          {b.statut_paiement}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.validation_technique && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] p-0"
                          onClick={() => {
                            setDetailBlId(b.bl_id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Print allowed: validated OR completed (livre/facture) */}
                        {(b.validation_technique || ['livre', 'facture'].includes(b.workflow_status || '')) && (
                          <BlPrintable 
                            bl={{
                              bl_id: b.bl_id,
                              date_livraison: b.date_livraison,
                              volume_m3: b.volume_m3,
                              formule_id: b.formule_id,
                              heure_depart_centrale: null,
                              toupie_assignee: b.toupie_assignee,
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        )}

        {/* Detail Dialog */}
        <BonDetailDialog
          blId={detailBlId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onUpdate={fetchData}
        />
      </div>
    </MainLayout>
  );
}
