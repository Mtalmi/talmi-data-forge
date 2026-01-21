import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Phone, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';

export interface DriverQuickContactProps {
  driverName: string | null;
  phoneNumber: string | null;
  blId: string;
  compact?: boolean;
}

export function DriverQuickContact({
  driverName,
  phoneNumber,
  blId,
  compact = false,
}: DriverQuickContactProps) {
  const handleCall = () => {
    if (!phoneNumber) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
    toast.success(`Appel vers ${driverName || 'chauffeur'}`);
  };

  const handleWhatsApp = () => {
    if (!phoneNumber) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }

    // Clean and format for WhatsApp
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '212' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('212')) {
      formattedPhone = '212' + formattedPhone;
    }

    const message = encodeURIComponent(
      `🚚 *Livraison ${blId}*\n\n` +
      `Bonjour ${driverName || ''},\n\n` +
      `Merci de confirmer votre statut pour cette livraison.\n\n` +
      `_TALMI Béton - Dispatch_`
    );

    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    toast.success('WhatsApp ouvert');
  };

  if (!driverName && !phoneNumber) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span>Non assigné</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCall}
              disabled={!phoneNumber}
              className="h-7 w-7 p-0"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Appeler {driverName}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsApp}
              disabled={!phoneNumber}
              className="h-7 w-7 p-0"
            >
              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>WhatsApp {driverName}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{driverName || 'Non assigné'}</span>
      </div>
      {phoneNumber && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCall}
                className="h-8 w-8 p-0"
              >
                <Phone className="h-4 w-4 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Appeler</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>WhatsApp</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
