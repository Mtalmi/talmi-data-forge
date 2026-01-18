import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
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
import { Plus, Truck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  cur_reel: number | null;
  ecart_marge: number | null;
  alerte_ecart: boolean;
  created_at: string;
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
}

export default function Bons() {
  const { user, isCeo, isOperator, isAccounting } = useAuth();
  const canCreate = isCeo || isOperator;
  const canUpdatePayment = isCeo || isAccounting;

  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toleranceErrors, setToleranceErrors] = useState<string[]>([]);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bonsRes, formulesRes, clientsRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('*').order('created_at', { ascending: false }),
        supabase.from('formules_theoriques').select('formule_id, designation, ciment_kg_m3, adjuvant_l_m3'),
        supabase.from('clients').select('client_id, nom_client'),
      ]);

      if (bonsRes.error) throw bonsRes.error;
      if (formulesRes.error) throw formulesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setBons(bonsRes.data || []);
      setFormules(formulesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

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
    setToleranceErrors([]);
  };

  useEffect(() => {
    if (dialogOpen) {
      resetForm();
    }
  }, [dialogOpen]);

  // Validate tolerances
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Volume validation
      const volumeNum = parseFloat(volume);
      if (volumeNum <= 0 || volumeNum >= 12) {
        toast.error('Volume doit être entre 0 et 12 m³');
        setSubmitting(false);
        return;
      }

      // Check for tolerance errors (warning but allow)
      const errors = validateTolerances();
      const hasAlerte = errors.length > 0;

      const { error } = await supabase.from('bons_livraison_reels').insert([{
        bl_id: blId,
        client_id: clientId,
        formule_id: formuleId,
        volume_m3: volumeNum,
        ciment_reel_kg: parseFloat(cimentReel),
        adjuvant_reel_l: adjuvantReel ? parseFloat(adjuvantReel) : null,
        eau_reel_l: eauReel ? parseFloat(eauReel) : null,
        km_parcourus: kmParcourus ? parseFloat(kmParcourus) : null,
        temps_mission_heures: tempsMission ? parseFloat(tempsMission) : null,
        statut_paiement: 'En Attente',
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

      if (hasAlerte) {
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

  const updatePaymentStatus = async (blId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ statut_paiement: newStatus })
        .eq('bl_id', blId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusPill = (status: string) => {
    const map: Record<string, string> = {
      'Payé': 'paid',
      'En Attente': 'pending',
      'Retard': 'late',
    };
    return map[status] || 'pending';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bons de Livraison</h1>
            <p className="text-muted-foreground mt-1">
              Suivi des livraisons et consommations réelles
            </p>
          </div>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Bon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un Bon de Livraison</DialogTitle>
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
                              {f.formule_id} - {f.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                    <p className="text-xs text-muted-foreground">Max: 12 m³</p>
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

                  {/* Tolerance Warnings */}
                  {toleranceErrors.length > 0 && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning text-sm">Alertes de Tolérance</p>
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

        {/* Table */}
        <div className="card-industrial overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
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
                  <TableHead className="text-right">Ciment</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bons.map((b) => (
                  <TableRow key={b.bl_id} className={b.alerte_ecart ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {b.bl_id}
                        {b.alerte_ecart && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(b.date_livraison), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{b.client_id}</TableCell>
                    <TableCell className="font-mono text-sm">{b.formule_id}</TableCell>
                    <TableCell className="text-right">{b.volume_m3} m³</TableCell>
                    <TableCell className="text-right font-mono">{b.ciment_reel_kg} kg</TableCell>
                    <TableCell>
                      {canUpdatePayment ? (
                        <Select
                          value={b.statut_paiement}
                          onValueChange={(val) => updatePaymentStatus(b.bl_id, val)}
                        >
                          <SelectTrigger className={cn(
                            'w-[130px] h-8',
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
                      {b.statut_paiement === 'Payé' && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
