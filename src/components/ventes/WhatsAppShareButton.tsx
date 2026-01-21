import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';
import { Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { logCommunication } from '@/lib/communicationLogger';

interface WhatsAppShareButtonProps {
  devis?: Devis;
  bc?: BonCommande;
  phoneNumber?: string;
  compact?: boolean;
}

export function WhatsAppShareButton({ devis, bc, phoneNumber, compact }: WhatsAppShareButtonProps) {
  const generateDevisMessage = (devis: Devis): string => {
    const lines = [
      `📋 *Devis N° ${devis.devis_id}*`,
      '',
      `👤 Client: ${devis.client?.nom_client || 'N/A'}`,
      `🏗️ Formule: ${devis.formule_id}`,
      `📦 Volume: ${devis.volume_m3} m³`,
      `💰 Prix unitaire: ${devis.prix_vente_m3?.toLocaleString() || 'N/A'} DH/m³`,
      `📊 *Total HT: ${devis.total_ht.toLocaleString()} DH*`,
      '',
      devis.date_expiration 
        ? `⏰ Valide jusqu'au: ${format(new Date(devis.date_expiration), 'dd MMMM yyyy', { locale: fr })}`
        : '',
      '',
      `Pour confirmer votre commande, veuillez nous contacter.`,
      '',
      `_TALMI Béton_`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const generateBcMessage = (bc: BonCommande): string => {
    const lines = [
      `📦 *Bon de Commande N° ${bc.bc_id}*`,
      '',
      `👤 Client: ${bc.client?.nom_client || 'N/A'}`,
      `🏗️ Formule: ${bc.formule_id}`,
      `📦 Volume: ${bc.volume_m3} m³`,
      `💰 Prix unitaire: ${bc.prix_vente_m3?.toLocaleString() || 'N/A'} DH/m³`,
      `📊 *Total HT: ${bc.total_ht.toLocaleString()} DH*`,
      '',
      bc.date_livraison_souhaitee 
        ? `📅 Livraison prévue: ${format(new Date(bc.date_livraison_souhaitee), 'dd MMMM yyyy', { locale: fr })}`
        : '',
      bc.heure_livraison_souhaitee 
        ? `🕐 Heure: ${bc.heure_livraison_souhaitee}`
        : '',
      bc.adresse_livraison
        ? `📍 Adresse: ${bc.adresse_livraison}`
        : '',
      '',
      `Votre commande a été enregistrée. Nous vous contacterons pour confirmer la livraison.`,
      '',
      `_TALMI Béton_`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleShare = async () => {
    let message = '';
    let phone = phoneNumber;
    let clientId = '';
    let referenceId = '';
    let category: 'devis_send' | 'bc_confirmation' = 'devis_send';

    if (devis) {
      message = generateDevisMessage(devis);
      phone = phone || (devis.client as any)?.telephone || '';
      clientId = devis.client_id || '';
      referenceId = devis.devis_id;
      category = 'devis_send';
    } else if (bc) {
      message = generateBcMessage(bc);
      phone = phone || bc.client?.telephone || bc.telephone_chantier || '';
      clientId = bc.client_id;
      referenceId = bc.bc_id;
      category = 'bc_confirmation';
    }

    if (!message) {
      toast.error('Impossible de générer le message');
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone?.replace(/[\s\-\(\)\.]/g, '') || '';
    
    // Format for WhatsApp (add Morocco code if needed)
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '212' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('212')) {
      formattedPhone = '212' + cleanPhone;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    const whatsappUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    // Open in new tab
    window.open(whatsappUrl, '_blank');

    // Log communication
    if (clientId) {
      await logCommunication({
        clientId,
        type: 'whatsapp',
        category,
        referenceId,
        referenceTable: devis ? 'devis' : 'bons_commande',
        recipient: formattedPhone || 'Non spécifié',
        subject: devis ? `Devis ${referenceId}` : `BC ${referenceId}`,
        messagePreview: message.substring(0, 200),
        status: 'sent',
      });
    }

    toast.success('WhatsApp ouvert');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'sm' : 'default'}
          onClick={handleShare}
          className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
        >
          <MessageCircle className="h-4 w-4" />
          {!compact && 'WhatsApp'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Envoyer via WhatsApp
      </TooltipContent>
    </Tooltip>
  );
}
