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
  PiggyBank, Shield, Camera, Banknote, Users, RefreshCw, 
  Landmark, CircleDollarSign, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { useI18n } from '@/i18n/I18nContext';

interface CashFeedingFormProps {
  onSuccess?: () => void;
}

type CashSourceType = 'customer_payment' | 'ceo_injection' | 'refund' | 'loan' | 'other';

export function CashFeedingForm({ onSuccess }: CashFeedingFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const cf = t.cashFeeding;
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [sourceType, setSourceType] = useState<CashSourceType | ''>('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [factureId, setFactureId] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [bankReference, setBankReference] = useState('');
  
  const [clients, setClients] = useState<{ client_id: string; nom_client: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [invoices, setInvoices] = useState<{ facture_id: string; total_ttc: number; date_facture: string }[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'none' | 'perfect' | 'close' | 'variance' | 'no_match'>('none');

  const sourceOptions: { value: CashSourceType; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'customer_payment', label: cf.customerPayment, icon: <Users className="h-4 w-4" />, description: cf.customerPaymentDesc },
    { value: 'ceo_injection', label: cf.ceoInjection, icon: <Landmark className="h-4 w-4" />, description: cf.ceoInjectionDesc },
    { value: 'refund', label: cf.refund, icon: <RefreshCw className="h-4 w-4" />, description: cf.refundDesc },
    { value: 'loan', label: cf.loan, icon: <CircleDollarSign className="h-4 w-4" />, description: cf.loanDesc },
    { value: 'other', label: cf.other, icon: <Banknote className="h-4 w-4" />, description: cf.otherDesc },
  ];

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
    if (!selectedClientId) { setInvoices([]); return; }
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

  const checkMatch = () => {
    if (!factureId || !amount) { setMatchStatus('none'); return; }
    const invoice = invoices.find(inv => inv.facture_id === factureId);
    if (!invoice) { setMatchStatus('no_match'); return; }
    const variance = Math.abs((parseFloat(amount) - invoice.total_ttc) / invoice.total_ttc) * 100;
    if (variance <= 1) setMatchStatus('perfect');
    else if (variance <= 5) setMatchStatus('close');
    else setMatchStatus('variance');
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const fileName = `cash-deposits/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('documents').upload(fileName, compressed);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const resetForm = () => {
    setAmount(''); setSourceType(''); setSourceDescription(''); setClientId('');
    setFactureId(''); setDepositDate(new Date().toISOString().split('T')[0]);
    setReceiptPhotoUrl(''); setNotes(''); setBankReference('');
    setInvoices([]); setMatchStatus('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceType) {
      toast({ title: cf.sourceRequired, description: cf.sourceRequiredDesc, variant: 'destructive' });
      return;
    }
    if (!receiptPhotoUrl) {
      toast({ title: cf.photoRequiredTitle, description: cf.photoRequiredDesc, variant: 'destructive' });
      return;
    }
    if (sourceType === 'customer_payment' && !clientId) {
      toast({ title: cf.clientRequired, description: cf.clientRequiredDesc, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let justificationStatus = 'pending';
      if (sourceType === 'customer_payment' && factureId) {
        justificationStatus = matchStatus === 'perfect' ? 'justified' : matchStatus === 'close' ? 'pending' : 'flagged';
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
        title: `✅ ${cf.depositSaved}`,
        description: cf.depositSavedDesc.replace('{amount}', parseFloat(amount).toLocaleString('fr-FR')),
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating cash deposit:', error);
      toast({ title: cf.error, description: error.message || cf.errorDesc, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = amount && parseFloat(amount) > 0 && sourceType && receiptPhotoUrl && (sourceType !== 'customer_payment' || clientId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) loadClients(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg">
          <PiggyBank className="h-4 w-4 mr-2" />
          {cf.triggerButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <PiggyBank className="h-5 w-5 text-emerald-500" />
            </div>
            {cf.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{cf.subtitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Photo Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                {cf.depositProof}
              </Label>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {cf.auditRequirement}
              </Badge>
            </div>
            <div className={cn(
              "rounded-xl border-2 border-dashed p-4 transition-all",
              receiptPhotoUrl ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"
            )}>
              <PhotoDropzone
                value={receiptPhotoUrl}
                onChange={(url) => setReceiptPhotoUrl(url || '')}
                onFileSelect={handleFileUpload}
                hint={cf.dragOrClick}
                required
              />
              {!receiptPhotoUrl && (
                <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{cf.photoRequired}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{cf.fundSource}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sourceOptions.map((option) => (
                <button
                  key={option.value} type="button"
                  onClick={() => setSourceType(option.value)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    sourceType === option.value
                      ? "border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", sourceType === option.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
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

          {/* Client Selection */}
          {sourceType === 'customer_payment' && (
            <div className="space-y-2">
              <Label>{cf.client} *</Label>
              <Select value={clientId} onValueChange={(val) => { setClientId(val); setFactureId(''); setMatchStatus('none'); loadInvoices(val); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingClients ? cf.loading : cf.selectClient} />
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

          {/* Invoice Selection */}
          {sourceType === 'customer_payment' && clientId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {cf.associatedInvoice}
                {matchStatus === 'perfect' && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">✅ {cf.perfectMatch}</Badge>
                )}
                {matchStatus === 'close' && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">⚠️ {cf.closeMatch}</Badge>
                )}
                {matchStatus === 'variance' && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">❌ {cf.varianceMatch}</Badge>
                )}
              </Label>
              <Select value={factureId} onValueChange={(val) => {
                setFactureId(val);
                const invoice = invoices.find(inv => inv.facture_id === val);
                if (invoice && !amount) setAmount(invoice.total_ttc.toString());
                setTimeout(checkMatch, 100);
              }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingInvoices ? cf.loading : cf.selectInvoice} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {invoices.length === 0 ? (
                    <SelectItem value="none" disabled>{cf.noUnpaidInvoices}</SelectItem>
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
                <p className="text-xs text-muted-foreground">{cf.noUnpaidInvoicesDesc}</p>
              )}
            </div>
          )}

          {/* Variance Warning */}
          {matchStatus === 'variance' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">{cf.varianceDetected}</p>
                  <p className="text-xs text-muted-foreground">{cf.varianceDesc}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{cf.amount} *</Label>
              <div className="relative">
                <Input
                  type="number" step="0.01" min="0.01" value={amount}
                  onChange={(e) => { setAmount(e.target.value); setTimeout(checkMatch, 100); }}
                  placeholder="0.00" className="pr-16 text-lg font-semibold bg-background" required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">MAD</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{cf.depositDate} *</Label>
              <Input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="bg-background" required />
            </div>
          </div>

          {/* Source Description */}
          {sourceType && sourceType !== 'customer_payment' && (
            <div className="space-y-2">
              <Label>{cf.sourceDescription}</Label>
              <Input value={sourceDescription} onChange={(e) => setSourceDescription(e.target.value)} placeholder={cf.sourceDescPlaceholder} className="bg-background" />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>{cf.notes}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={cf.notesPlaceholder} className="bg-background resize-none" rows={2} />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{cf.cancel}</Button>
            <Button
              type="submit" disabled={!canSubmit || isSubmitting}
              className={cn("min-w-[180px] transition-all",
                canSubmit ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg" : "bg-muted text-muted-foreground"
              )}
            >
              {isSubmitting ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{cf.saving}</>
              ) : (
                <><Shield className="h-4 w-4 mr-2" />{cf.saveDeposit}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
