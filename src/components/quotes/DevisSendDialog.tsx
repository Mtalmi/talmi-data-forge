import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Mail, MessageCircle, Loader2, Check, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n/I18nContext';

interface DevisSendDialogProps {
  devis: {
    devis_id: string;
    formule_id: string;
    volume_m3: number;
    prix_vente_m3: number;
    total_ht: number;
    date_expiration: string | null;
    client?: { nom_client: string; adresse: string | null; email?: string | null; telephone?: string | null } | null;
    formule?: { designation: string } | null;
  };
}

export function DevisSendDialog({ devis }: DevisSendDialogProps) {
  const { t } = useI18n();
  const ds = t.devisSend;
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(devis.client?.email || '');
  const [recipientName, setRecipientName] = useState(devis.client?.nom_client || '');
  const [phone, setPhone] = useState(devis.client?.telephone || '');
  const [includeCgv, setIncludeCgv] = useState(true);
  const [fullCgv, setFullCgv] = useState(devis.volume_m3 >= 500);

  const handleSendEmail = async () => {
    if (!email || !recipientName) {
      toast.error(ds.emailAndNameRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(ds.invalidEmail);
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-devis-email', {
        body: {
          to_email: email,
          to_name: recipientName,
          devis_id: devis.devis_id,
          formule_id: devis.formule_id,
          formule_designation: devis.formule?.designation || '',
          volume_m3: devis.volume_m3,
          prix_vente_m3: devis.prix_vente_m3,
          total_ht: devis.total_ht,
          total_ttc: devis.total_ht * 1.2,
          date_expiration: devis.date_expiration,
          client_name: devis.client?.nom_client || '',
          client_address: devis.client?.adresse || null,
          include_cgv: includeCgv,
          full_cgv: fullCgv,
        },
      });

      if (error) throw error;

      setSent(true);
      toast.success(ds.sentSuccess);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(ds.sendError + ': ' + (error.message || ds.unknownError));
    } finally {
      setSending(false);
    }
  };

  const handleWhatsAppSend = () => {
    if (!phone) {
      toast.error(ds.phoneRequired);
      return;
    }

    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '212' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('212')) {
      cleanPhone = '212' + cleanPhone;
    }
    cleanPhone = cleanPhone.replace('+', '');

    const message = encodeURIComponent(
      `${ds.waGreeting.replace('{name}', recipientName)}\n\n` +
      `${ds.waIntro}\n\n` +
      `📋 *${devis.devis_id}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🏗️ ${ds.waFormula}: ${devis.formule_id}\n` +
      `📦 ${ds.waVolume}: ${devis.volume_m3} m³\n` +
      `💰 ${ds.waPrice}: ${devis.prix_vente_m3.toLocaleString()} DH/m³\n` +
      `━━━━━━━━━━━━━━━\n` +
      `*TOTAL HT: ${devis.total_ht.toLocaleString()} DH*\n` +
      `*TOTAL TTC: ${(devis.total_ht * 1.2).toLocaleString()} DH*\n\n` +
      (devis.date_expiration ? `⏰ ${ds.waValidUntil}: ${new Date(devis.date_expiration).toLocaleDateString()}\n\n` : '') +
      `${ds.waConfirm}\n\n` +
      `TALMI BETON 🏭`
    );

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success(ds.whatsappOpened);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          {ds.send}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ds.sendQuote.replace('{id}', devis.devis_id)}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-name">{ds.recipientName}</Label>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={ds.fullName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{ds.emailAddress}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="include-cgv" className="cursor-pointer">{ds.includeCgv}</Label>
                </div>
                <Switch id="include-cgv" checked={includeCgv} onCheckedChange={setIncludeCgv} />
              </div>
              
              {includeCgv && (
                <div className="flex items-center justify-between pl-6">
                  <Label htmlFor="full-cgv" className="text-sm text-muted-foreground cursor-pointer">{ds.fullVersion}</Label>
                  <Switch id="full-cgv" checked={fullCgv} onCheckedChange={setFullCgv} />
                </div>
              )}
              
              {includeCgv && (
                <p className="text-xs text-muted-foreground pl-6">
                  {fullCgv ? ds.fullCgvDesc : ds.shortCgvDesc}
                </p>
              )}
            </div>
            
            <Button onClick={handleSendEmail} disabled={sending || sent} className="w-full gap-2">
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{ds.sending}</>
              ) : sent ? (
                <><Check className="h-4 w-4" />{ds.sent}</>
              ) : (
                <><Mail className="h-4 w-4" />{ds.sendByEmail}</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-name-wa">{ds.recipientName}</Label>
              <Input
                id="recipient-name-wa"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={ds.fullName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{ds.whatsappNumber}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6XX XXX XXX"
              />
            </div>
            <Button onClick={handleWhatsAppSend} className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4" />
              {ds.openWhatsApp}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">{ds.quoteSummary}:</p>
          <p className="text-muted-foreground">
            {devis.volume_m3} m³ de {devis.formule_id} à {devis.prix_vente_m3.toLocaleString()} DH/m³
          </p>
          <p className="font-semibold text-primary mt-1">
            {ds.totalTtc}: {(devis.total_ht * 1.2).toLocaleString()} DH
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}