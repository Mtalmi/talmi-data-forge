import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';
import { Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { logCommunication } from '@/lib/communicationLogger';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { formatMontant } from '@/utils/formatters';

interface WhatsAppShareButtonProps {
  devis?: Devis;
  bc?: BonCommande;
  phoneNumber?: string;
  compact?: boolean;
}

export function WhatsAppShareButton({ devis, bc, phoneNumber, compact }: WhatsAppShareButtonProps) {
  const { t, lang } = useI18n();
  const ws = t.whatsappShare;
  const dateLocale = getDateLocale(lang);

  const generateDevisMessage = (devis: Devis): string => {
    const lines = [
      `📋 *${ws.quoteNo} ${devis.devis_id}*`,
      '',
      `👤 ${ws.client}: ${devis.client?.nom_client || 'N/A'}`,
      `🏗️ ${ws.formula}: ${devis.formule_id}`,
      `📦 ${ws.volume}: ${devis.volume_m3} m³`,
      `💰 ${ws.unitPrice}: ${formatMontant(devis.prix_vente_m3)} DH/m³`,
      `📊 *${ws.totalHT}: ${formatMontant(devis.total_ht)} DH*`,
      '',
      devis.date_expiration ? `⏰ ${ws.validUntil}: ${format(new Date(devis.date_expiration), 'dd MMMM yyyy', { locale: dateLocale || undefined })}` : '',
      '',
      ws.confirmOrder,
      '',
      `_TALMI Béton_`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const generateBcMessage = (bc: BonCommande): string => {
    const lines = [
      `📦 *${ws.orderNo} ${bc.bc_id}*`,
      '',
      `👤 ${ws.client}: ${bc.client?.nom_client || 'N/A'}`,
      `🏗️ ${ws.formula}: ${bc.formule_id}`,
      `📦 ${ws.volume}: ${bc.volume_m3} m³`,
      `💰 ${ws.unitPrice}: ${bc.prix_vente_m3?.toLocaleString() || 'N/A'} DH/m³`,
      `📊 *${ws.totalHT}: ${bc.total_ht.toLocaleString()} DH*`,
      '',
      bc.date_livraison_souhaitee ? `📅 ${ws.plannedDelivery}: ${format(new Date(bc.date_livraison_souhaitee), 'dd MMMM yyyy', { locale: dateLocale || undefined })}` : '',
      bc.heure_livraison_souhaitee ? `🕐 ${ws.time}: ${bc.heure_livraison_souhaitee}` : '',
      bc.adresse_livraison ? `📍 ${ws.address}: ${bc.adresse_livraison}` : '',
      '',
      ws.orderRegistered,
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

    if (!message) { toast.error(ws.cannotGenerate); return; }

    const cleanPhone = phone?.replace(/[\s\-\(\)\.]/g, '') || '';
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) formattedPhone = '212' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('212')) formattedPhone = '212' + cleanPhone;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    if (clientId) {
      await logCommunication({
        clientId, type: 'whatsapp', category, referenceId,
        referenceTable: devis ? 'devis' : 'bons_commande',
        recipient: formattedPhone || 'Non spécifié',
        subject: devis ? `Devis ${referenceId}` : `BC ${referenceId}`,
        messagePreview: message.substring(0, 200),
        status: 'sent',
      });
    }
    toast.success(ws.opened);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size={compact ? 'sm' : 'default'} onClick={handleShare} className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20">
          <MessageCircle className="h-4 w-4" />
          {!compact && 'WhatsApp'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{ws.sendVia}</TooltipContent>
    </Tooltip>
  );
}
