import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PhotoDropzone } from '@/components/ui/PhotoDropzone';
import { Badge } from '@/components/ui/badge';
import { 
  PiggyBank, 
  Shield, 
  Camera, 
  Banknote, 
  Users, 
  RefreshCw, 
  Landmark,
  CircleDollarSign,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';

interface CashFeedingFormProps {
  onSuccess?: () => void;
}

type CashSourceType = 'customer_payment' | 'ceo_injection' | 'refund' | 'loan' | 'other';

const sourceOptions: { value: CashSourceType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'customer_payment', 
    label: 'Paiement Client', 
    icon: <Users className="h-4 w-4" />,
    description: 'Règlement reçu d\'un client'
  },
  { 
    value: 'ceo_injection', 
    label: 'Injection CEO', 
    icon: <Landmark className="h-4 w-4" />,
    description: 'Apport de fonds par la direction'
  },
  { 
    value: 'refund', 
    label: 'Remboursement', 
    icon: <RefreshCw className="h-4 w-4" />,
    description: 'Retour de fonds (fournisseur, etc.)'
  },
  { 
    value: 'loan', 
    label: 'Prêt / Crédit', 
    icon: <CircleDollarSign className="h-4 w-4" />,
    description: 'Financement externe'
  },
  { 
    value: 'other', 
    label: 'Autre', 
    icon: <Banknote className="h-4 w-4" />,
    description: 'Autre source de fonds'
  },
];

export function CashFeedingForm({ onSuccess }: CashFeedingFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [sourceType, setSourceType] = useState<CashSourceType | ''>('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [factureId, setFactureId] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [bankReference, setBankReference] = useState('');
  
  // Clients for customer_payment
  const [clients, setClients] = useState<{ client_id: string; nom_client: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Invoices for auto-matching
  const [invoices, setInvoices] = useState<{ facture_id: string; total_ttc: number; date_facture: string }[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'none' | 'perfect' | 'close' | 'variance' | 'no_match'>('none');

  const loadClients = async () => {
    setLoadingClients(true);
    const { data } = await supabase
      .from('clients')
      .select('client_id, nom_client')
      .order('nom_client') as { data: any[] | null };
    if (data) setClients(data);
    setLoadingClients(false);
  };

  const loadInvoices = async (selectedClientId: string) => {
    if (!selectedClientId) {
      setInvoices([]);
      return;
    }
    setLoadingInvoices(true);
    const { data } = await supabase
      .from('factures')
      .select('facture_id, total_ttc, date_facture')
      .eq('client_id', selectedClientId)
      .neq('statut', 'Payé')
      .order('date_facture', { ascending: false }) as { data: any[] | null };
    if (data) setInvoices(data);
    setLoadingInvoices(false);
  };

  // Auto-check match when amount or invoice changes
  const checkMatch = () => {
    if (!factureId || !amount) {
      setMatchStatus('none');
      return;
    }
    const invoice = invoices.find(inv => inv.facture_id === factureId);
    if (!invoice) {
      setMatchStatus('no_match');
      return;
    }
    const variance = Math.abs((parseFloat(amount) - invoice.total_ttc) / invoice.total_ttc) * 100;
    if (variance <= 1) {
      setMatchStatus('perfect');
    } else if (variance <= 5) {
      setMatchStatus('close');
    } else {
      setMatchStatus('variance');
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const fileName = `cash-deposits/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, compressed);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const resetForm = () => {
    setAmount('');
    setSourceType('');
    setSourceDescription('');
    setClientId('');
    setFactureId('');
    setDepositDate(new Date().toISOString().split('T')[0]);
    setReceiptPhotoUrl('');
    setNotes('');
    setBankReference('');
    setInvoices([]);
    setMatchStatus('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceType) {
      toast({
        title: 'Source requise',
        description: 'Veuillez sélectionner une source de fonds.',
        variant: 'destructive',
      });
      return;
    }

    if (!receiptPhotoUrl) {
      toast({
        title: 'Photo requise',
        description: 'Veuillez télécharger une photo du bordereau ou reçu.',
        variant: 'destructive',
      });
      return;
    }

    if (sourceType === 'customer_payment' && !clientId) {
      toast({
        title: 'Client requis',
        description: 'Veuillez sélectionner le client pour un paiement client.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine justification status based on source and matching
      let justificationStatus = 'pending';
      if (sourceType === 'customer_payment' && factureId) {
        justificationStatus = matchStatus === 'perfect' ? 'justified' : 
                              matchStatus === 'close' ? 'pending' : 'flagged';
      } else if (sourceType === 'ceo_injection' || sourceType === 'loan') {
        justificationStatus = sourceDescription ? 'justified' : 'pending';
      }

      const { error } = await supabase
        .from('cash_deposits')
        .insert({
          amount: parseFloat(amount),
          source_type: sourceType,
          source_description: sourceDescription || null,
          client_id: sourceType === 'customer_payment' ? clientId : null,
          facture_id: factureId || null,
          deposit_date: depositDate,
          receipt_photo_url: receiptPhotoUrl,
          notes: notes || null,
          bank_reference: bankReference || null,
          justification_status: justificationStatus,
          created_by: user?.id,
          created_by_name: user?.email,
        });

      if (error) throw error;

      toast({
        title: '✅ Dépôt enregistré',
        description: `Alimentation de ${parseFloat(amount).toLocaleString('fr-FR')} MAD documentée avec succès.`,
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating cash deposit:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer le dépôt.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = 
    amount && 
    parseFloat(amount) > 0 && 
    sourceType && 
    receiptPhotoUrl &&
    (sourceType !== 'customer_payment' || clientId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) loadClients();
    }}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg"
        >
          <PiggyBank className="h-4 w-4 mr-2" />
          Alimentation Caisse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <PiggyBank className="h-5 w-5 text-emerald-500" />
            </div>
            Alimentation Caisse
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enregistrer une entrée de fonds avec documentation obligatoire
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Photo Upload - MANDATORY FIRST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Preuve de Dépôt
              </Label>
              <Badge 
                variant="outline" 
                className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
              >
                <Shield className="h-3 w-3 mr-1" />
                Audit Requirement: Photo Mandatory
              </Badge>
            </div>
            
            <div className={cn(
              "rounded-xl border-2 border-dashed p-4 transition-all",
              receiptPhotoUrl 
                ? "border-emerald-500/50 bg-emerald-500/5" 
                : "border-destructive/50 bg-destructive/5"
            )}>
              <PhotoDropzone
                value={receiptPhotoUrl}
                onChange={(url) => setReceiptPhotoUrl(url || '')}
                onFileSelect={handleFileUpload}
                hint="Glissez ou cliquez pour ajouter le bordereau/reçu"
                required
              />
              {!receiptPhotoUrl && (
                <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Photo du bordereau ou reçu obligatoire</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Source des Fonds</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sourceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSourceType(option.value)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    sourceType === option.value
                      ? "border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    sourceType === option.value 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Client Selection (for customer_payment) */}
          {sourceType === 'customer_payment' && (
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select 
                value={clientId} 
                onValueChange={(val) => {
                  setClientId(val);
                  setFactureId('');
                  setMatchStatus('none');
                  loadInvoices(val);
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingClients ? "Chargement..." : "Sélectionner le client"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {clients.map((client) => (
                    <SelectItem key={client.client_id} value={client.client_id}>
                      {client.nom_client} ({client.client_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Invoice Selection (for customer_payment with client selected) */}
          {sourceType === 'customer_payment' && clientId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Facture Associée
                {matchStatus === 'perfect' && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                    ✅ Match Parfait
                  </Badge>
                )}
                {matchStatus === 'close' && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                    ⚠️ Écart &lt;5%
                  </Badge>
                )}
                {matchStatus === 'variance' && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                    ❌ Écart &gt;5%
                  </Badge>
                )}
              </Label>
              <Select 
                value={factureId} 
                onValueChange={(val) => {
                  setFactureId(val);
                  // Auto-fill amount if invoice selected
                  const invoice = invoices.find(inv => inv.facture_id === val);
                  if (invoice && !amount) {
                    setAmount(invoice.total_ttc.toString());
                  }
                  setTimeout(checkMatch, 100);
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingInvoices ? "Chargement..." : "Sélectionner la facture"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {invoices.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucune facture impayée
                    </SelectItem>
                  ) : (
                    invoices.map((invoice) => (
                      <SelectItem key={invoice.facture_id} value={invoice.facture_id}>
                        {invoice.facture_id} - {invoice.total_ttc.toLocaleString('fr-MA')} DH
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {invoices.length === 0 && !loadingInvoices && (
                <p className="text-xs text-muted-foreground">
                  Aucune facture impayée pour ce client. Le dépôt sera marqué pour vérification.
                </p>
              )}
            </div>
          )}

          {/* Match Status Warning */}
          {matchStatus === 'variance' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Écart Détecté</p>
                  <p className="text-xs text-muted-foreground">
                    Le montant du dépôt diffère de plus de 5% du montant de la facture. 
                    Ce dépôt sera signalé pour vérification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (MAD) *</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setTimeout(checkMatch, 100);
                  }}
                  placeholder="0.00"
                  className="pr-16 text-lg font-semibold bg-background"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  MAD
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Date du Dépôt *</Label>
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="bg-background"
                required
              />
            </div>
          </div>

          {/* Source Description (for other types) */}
          {sourceType && sourceType !== 'customer_payment' && (
            <div className="space-y-2">
              <Label>Description de la Source</Label>
              <Input
                value={sourceDescription}
                onChange={(e) => setSourceDescription(e.target.value)}
                placeholder="Détails sur l'origine des fonds..."
                className="bg-background"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              className="bg-background resize-none"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "min-w-[180px] transition-all",
                canSubmit 
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Enregistrer le Dépôt
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}