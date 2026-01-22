import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Zap,
  Clock,
  Loader2,
  Shield,
  Phone,
  Building2,
  Package,
} from 'lucide-react';
import { OrderFormFields } from './OrderFormFields';
import { QuickClientCreate } from './QuickClientCreate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';

interface Client {
  client_id: string;
  nom_client: string;
  adresse: string | null;
  telephone: string | null;
  credit_bloque?: boolean;
  solde_du?: number;
  limite_credit_dh?: number;
}

interface Formule {
  formule_id: string;
  designation: string;
  cut_dh_m3: number | null;
}

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  prix_livraison_m3: number;
}

interface Prestataire {
  id: string;
  nom_prestataire: string;
  tarif_base_m3: number;
}

interface EmergencyBcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  formules: Formule[];
  zones: Zone[];
  prestataires: Prestataire[];
  onSuccess: (bcId: string, isEmergency: boolean) => void;
}

export function EmergencyBcDialog({
  open,
  onOpenChange,
  clients,
  formules,
  zones,
  prestataires,
  onSuccess,
}: EmergencyBcDialogProps) {
  const { user, isDirecteurOperations, isCeo, isSuperviseur, canUseEmergencyBypass, isInEmergencyWindow } = useAuth();
  
  const [creating, setCreating] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  
  // Form state
  const [clientId, setClientId] = useState('');
  const [formuleId, setFormuleId] = useState('');
  const [volume, setVolume] = useState('');
  const [prix, setPrix] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date());
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telephoneChantier, setTelephoneChantier] = useState('');
  const [referenceClient, setReferenceClient] = useState('');
  const [conditionsAcces, setConditionsAcces] = useState('');
  const [pompeRequise, setPompeRequise] = useState(false);
  const [typePompe, setTypePompe] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [modePaiement, setModePaiement] = useState('virement');
  const [selectedPrestataireId, setSelectedPrestataireId] = useState('');
  
  // Check if selected client is blacklisted
  const selectedClient = clients.find(c => c.client_id === clientId);
  const isClientBlacklisted = selectedClient?.credit_bloque === true;
  const isClientOverLimit = selectedClient && 
    (selectedClient.solde_du || 0) > (selectedClient.limite_credit_dh || 50000);

  // Determine if this is Dir Ops creating (requires pending validation outside emergency)
  const requiresPendingValidation = isDirecteurOperations && !isCeo && !isSuperviseur;
  const isEmergencyMode = requiresPendingValidation && canUseEmergencyBypass && emergencyReason.length >= 10;

  const resetForm = () => {
    setClientId('');
    setFormuleId('');
    setVolume('');
    setPrix('');
    setDeliveryDate(new Date());
    setDeliveryTime('');
    setDeliveryAddress('');
    setContactChantier('');
    setTelephoneChantier('');
    setReferenceClient('');
    setConditionsAcces('');
    setPompeRequise(false);
    setTypePompe('');
    setNotes('');
    setSelectedZoneId('');
    setModePaiement('virement');
    setSelectedPrestataireId('');
    setEmergencyReason('');
  };

  const handleClientSelect = (id: string) => {
    setClientId(id);
    const client = clients.find(c => c.client_id === id);
    if (client) {
      setDeliveryAddress(client.adresse || '');
      setTelephoneChantier(client.telephone || '');
    }
  };

  const sendEmergencyAlerts = async (bcId: string, clientName: string) => {
    try {
      // Create system alert for CEO
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'bc_urgence_nuit',
        niveau: 'critical',
        titre: `⚠️ BC URGENCE NUIT: ${bcId}`,
        message: `Le Dir. Opérations a créé une commande d'urgence pour ${clientName}. Raison: ${emergencyReason}`,
        destinataire_role: 'ceo',
        reference_id: bcId,
        reference_table: 'bons_commande',
        dismissible: false,
      });
      
      // Create alert for Superviseur
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'bc_urgence_nuit',
        niveau: 'critical',
        titre: `⚠️ BC URGENCE NUIT: ${bcId}`,
        message: `Le Dir. Opérations a créé une commande d'urgence pour ${clientName}. Raison: ${emergencyReason}`,
        destinataire_role: 'superviseur',
        reference_id: bcId,
        reference_table: 'bons_commande',
        dismissible: false,
      });

      // Create alert for Resp. Technique to review formula selection
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'bc_urgence_verification_technique',
        niveau: 'warning',
        titre: `🔬 Vérification Technique: ${bcId}`,
        message: `BC d'urgence créé la nuit. Veuillez vérifier la sélection de formule avant le départ du premier camion.`,
        destinataire_role: 'responsable_technique',
        reference_id: bcId,
        reference_table: 'bons_commande',
        dismissible: true,
      });

    } catch (error) {
      console.error('Error sending emergency alerts:', error);
    }
  };

  const handleCreate = async () => {
    if (!clientId || !formuleId || !volume || !prix || !deliveryDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Hard block for blacklisted clients - even in emergency
    if (isClientBlacklisted) {
      triggerHaptic('error');
      toast.error('Client BLOQUÉ - Seul le CEO ou Superviseur peut débloquer ce client');
      return;
    }

    // Require emergency reason for Dir Ops in emergency mode
    if (requiresPendingValidation && isInEmergencyWindow && emergencyReason.length < 10) {
      toast.error('Veuillez fournir une raison détaillée pour la commande d\'urgence (min. 10 caractères)');
      return;
    }

    setCreating(true);

    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const bc_id = `BC-${year}${month}-${random}`;
      const total_ht = parseFloat(volume) * parseFloat(prix);

      // Determine status based on role and emergency mode
      let statut = 'pret_production';
      let notesWithEmergency = notes || '';
      
      if (requiresPendingValidation) {
        if (isEmergencyMode) {
          statut = 'pret_production'; // Emergency bypass - immediate production
          notesWithEmergency = `[URGENCE/EMERGENCY - ${new Date().toLocaleString('fr-FR')}] ${emergencyReason}\n\n${notes || ''}`;
        } else {
          statut = 'en_attente_validation'; // Pending validation from Admin
        }
      }

      const selectedZone = zones.find(z => z.id === selectedZoneId);
      const prixLivraison = selectedZone?.prix_livraison_m3 || 0;

      const { data: newBc, error } = await supabase
        .from('bons_commande')
        .insert({
          bc_id,
          client_id: clientId,
          formule_id: formuleId,
          volume_m3: parseFloat(volume),
          prix_vente_m3: parseFloat(prix),
          total_ht,
          statut,
          date_livraison_souhaitee: deliveryDate.toISOString().split('T')[0],
          heure_livraison_souhaitee: deliveryTime || null,
          adresse_livraison: deliveryAddress || null,
          contact_chantier: contactChantier || null,
          telephone_chantier: telephoneChantier || null,
          reference_client: referenceClient || null,
          conditions_acces: conditionsAcces || null,
          pompe_requise: pompeRequise,
          type_pompe: typePompe || null,
          notes: notesWithEmergency || null,
          zone_livraison_id: selectedZoneId || null,
          mode_paiement: modePaiement,
          prix_livraison_m3: prixLivraison,
          prestataire_id: selectedPrestataireId || null,
          prix_verrouille: !requiresPendingValidation, // Lock price only for standard path
          created_by: user?.id,
          validated_by: isEmergencyMode ? null : (requiresPendingValidation ? null : user?.id),
          validated_at: isEmergencyMode ? null : (requiresPendingValidation ? null : new Date().toISOString()),
        })
        .select()
        .single();

      if (error) throw error;

      // Send emergency alerts if in emergency mode
      if (isEmergencyMode) {
        await sendEmergencyAlerts(bc_id, selectedClient?.nom_client || clientId);
        triggerHaptic('success');
        toast.warning(`BC URGENCE ${bc_id} créé - Alertes envoyées au CEO et Superviseur`);
      } else if (requiresPendingValidation && !isInEmergencyWindow) {
        triggerHaptic('success');
        toast.info(`BC ${bc_id} créé en attente de validation prix par l'Admin`);
      } else {
        triggerHaptic('success');
        toast.success(`BC ${bc_id} créé avec succès!`);
      }

      resetForm();
      onOpenChange(false);
      onSuccess(bc_id, isEmergencyMode);

    } catch (error) {
      console.error('Error creating BC:', error);
      triggerHaptic('error');
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setCreating(false);
    }
  };

  const isFormValid = clientId && formuleId && volume && prix && deliveryDate && !isClientBlacklisted;
  const currentHour = new Date().getHours();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isInEmergencyWindow && requiresPendingValidation ? (
              <>
                <Zap className="h-6 w-6 text-amber-500" />
                Commande Urgence Nuit
              </>
            ) : requiresPendingValidation ? (
              <>
                <Clock className="h-6 w-6 text-blue-500" />
                Nouvelle Commande (Validation Requise)
              </>
            ) : (
              <>
                <Package className="h-6 w-6 text-primary" />
                Nouvelle Commande Directe
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {requiresPendingValidation && !isInEmergencyWindow && (
              <span className="text-blue-600">
                Cette commande sera soumise à validation de prix par l'Agent Administratif
              </span>
            )}
            {isInEmergencyWindow && requiresPendingValidation && (
              <span className="text-amber-600">
                Mode Urgence Nuit actif (18h00-00h00) - Bypass disponible avec justification
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Emergency Mode Indicator */}
          {isInEmergencyWindow && requiresPendingValidation && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-amber-700">Protocole Urgence Minuit</span>
                <Badge variant="outline" className="ml-auto text-amber-600 border-amber-500">
                  {currentHour}:00 - Fenêtre Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Vous pouvez créer une commande en bypass, mais le CEO et Superviseur seront alertés immédiatement.
              </p>
              <div className="space-y-2">
                <Label className="text-amber-700">Raison de l'Urgence (obligatoire) *</Label>
                <Textarea
                  placeholder="Expliquez pourquoi cette commande doit être traitée en urgence..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="border-amber-500/50 focus:border-amber-500"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères. Cette raison sera visible par le CEO et Superviseur.
                </p>
              </div>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Client *
            </Label>
            <div className="flex gap-2">
              <Select value={clientId} onValueChange={handleClientSelect}>
                <SelectTrigger className={`flex-1 ${isClientBlacklisted ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem 
                      key={client.client_id} 
                      value={client.client_id}
                      className={client.credit_bloque ? 'text-destructive' : ''}
                    >
                      {client.nom_client}
                      {client.credit_bloque && ' 🚫 BLOQUÉ'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuickClientCreate
                onClientCreated={(id, name) => handleClientSelect(id)}
              />
            </div>
            
            {/* Blacklist Warning */}
            {isClientBlacklisted && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">CLIENT BLOQUÉ - Non-Paiement</p>
                  <p className="text-xs text-muted-foreground">
                    Seul le CEO ou Superviseur peut débloquer ce client. Contactez la direction.
                  </p>
                </div>
              </div>
            )}
            
            {/* Credit Warning (non-blocking) */}
            {!isClientBlacklisted && isClientOverLimit && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Dépassement Plafond Crédit</p>
                  <p className="text-xs text-muted-foreground">
                    Solde: {(selectedClient?.solde_du || 0).toLocaleString()} DH / Limite: {(selectedClient?.limite_credit_dh || 50000).toLocaleString()} DH
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Formula Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Formule Béton *
            </Label>
            <Select value={formuleId} onValueChange={setFormuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une formule" />
              </SelectTrigger>
              <SelectContent>
                {formules.map((formule) => (
                  <SelectItem key={formule.formule_id} value={formule.formule_id}>
                    {formule.formule_id} - {formule.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Volume (m³) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
            <div className="space-y-2">
              <Label>Prix de Vente (DH/m³) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="Ex: 850"
              />
            </div>
          </div>

          {/* Total HT */}
          {volume && prix && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total HT</span>
                <span className="text-2xl font-bold text-primary font-mono">
                  {(parseFloat(volume) * parseFloat(prix)).toLocaleString()} DH
                </span>
              </div>
            </div>
          )}

          {/* Order Form Fields */}
          <OrderFormFields
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            contactChantier={contactChantier}
            setContactChantier={setContactChantier}
            telephoneChantier={telephoneChantier}
            setTelephoneChantier={setTelephoneChantier}
            referenceClient={referenceClient}
            setReferenceClient={setReferenceClient}
            conditionsAcces={conditionsAcces}
            setConditionsAcces={setConditionsAcces}
            pompeRequise={pompeRequise}
            setPompeRequise={setPompeRequise}
            typePompe={typePompe}
            setTypePompe={setTypePompe}
            notes={notes}
            setNotes={setNotes}
            selectedZoneId={selectedZoneId}
            setSelectedZoneId={setSelectedZoneId}
            modePaiement={modePaiement}
            setModePaiement={setModePaiement}
            selectedPrestataireId={selectedPrestataireId}
            setSelectedPrestataireId={setSelectedPrestataireId}
            zones={zones}
            prestataires={prestataires}
          />

          {/* Pending Validation Warning */}
          {requiresPendingValidation && !isEmergencyMode && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-700 flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4" />
                Validation Prix Requise
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cette commande sera visible dans la file d'attente de l'Agent Administratif. 
                La production ne pourra pas démarrer avant validation du prix.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={creating || !isFormValid || (requiresPendingValidation && isInEmergencyWindow && emergencyReason.length < 10)} 
            className={`gap-2 ${isEmergencyMode ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            size="lg"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEmergencyMode ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {isEmergencyMode 
              ? 'Créer BC Urgence' 
              : requiresPendingValidation 
                ? 'Soumettre pour Validation'
                : 'Créer la Commande'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}