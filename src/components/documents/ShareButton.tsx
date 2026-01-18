import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShareButtonProps {
  documentType: 'devis' | 'bc' | 'facture';
  documentId: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientName?: string;
  documentSummary?: string;
}

export function ShareButton({
  documentType,
  documentId,
  clientEmail,
  clientPhone,
  clientName = 'Client',
  documentSummary = '',
}: ShareButtonProps) {
  const [sending, setSending] = useState(false);

  const getDocumentLabel = () => {
    switch (documentType) {
      case 'devis': return 'Devis';
      case 'bc': return 'Bon de Commande';
      case 'facture': return 'Facture';
    }
  };

  const handleWhatsApp = () => {
    if (!clientPhone) {
      toast.error('Numéro de téléphone du client non disponible');
      return;
    }

    // Clean phone number
    let phone = clientPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (phone.startsWith('0')) {
      phone = '+212' + phone.slice(1);
    }
    if (!phone.startsWith('+')) {
      phone = '+212' + phone;
    }

    const message = encodeURIComponent(
      `Bonjour ${clientName},\n\n` +
      `Veuillez trouver ci-joint votre ${getDocumentLabel()} N° ${documentId}.\n\n` +
      (documentSummary ? `${documentSummary}\n\n` : '') +
      `Cordialement,\nTalmi Beton`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('Redirection vers WhatsApp...');
  };

  const handleEmail = async () => {
    if (!clientEmail) {
      toast.error('Email du client non disponible');
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-document-email', {
        body: {
          to: clientEmail,
          documentType,
          documentId,
          clientName,
          documentSummary,
        },
      });

      if (error) throw error;

      toast.success(`Email envoyé à ${clientEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={sending}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleWhatsApp} disabled={!clientPhone}>
          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
          WhatsApp
          {!clientPhone && <span className="ml-2 text-xs text-muted-foreground">(pas de n°)</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail} disabled={!clientEmail || sending}>
          <Mail className="h-4 w-4 mr-2 text-blue-500" />
          Email
          {!clientEmail && <span className="ml-2 text-xs text-muted-foreground">(pas d'email)</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
