import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Phone, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

export interface DriverQuickContactProps {
  driverName: string | null;
  phoneNumber: string | null;
  blId: string;
  compact?: boolean;
}

export const DriverQuickContact = forwardRef<HTMLDivElement, DriverQuickContactProps>(
  function DriverQuickContact({ driverName, phoneNumber, blId, compact = false }, ref) {
    const { t } = useI18n();
    const dc = t.driverContact;

    const handleCall = () => {
      if (!phoneNumber) {
        toast.error(dc.phoneUnavailable);
        return;
      }
      
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
      window.open(`tel:${cleanPhone}`, '_self');
      toast.success(dc.callTo.replace('{name}', driverName || ''));
    };

    const handleWhatsApp = () => {
      if (!phoneNumber) {
        toast.error(dc.phoneUnavailable);
        return;
      }

      let formattedPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '212' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('212')) {
        formattedPhone = '212' + formattedPhone;
      }

      const message = encodeURIComponent(
        dc.deliveryMessage
          .replace('{blId}', blId)
          .replace('{name}', driverName || '')
      );

      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
      toast.success(dc.whatsappOpened);
    };

    if (!driverName && !phoneNumber) {
      return (
        <div ref={ref} className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{dc.notAssigned}</span>
        </div>
      );
    }

    if (compact) {
      return (
        <div ref={ref} className="flex items-center gap-1">
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
            <TooltipContent>{dc.callDriver.replace('{name}', driverName || '')}</TooltipContent>
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
            <TooltipContent>{dc.whatsappDriver.replace('{name}', driverName || '')}</TooltipContent>
          </Tooltip>
        </div>
      );
    }

    return (
      <div ref={ref} className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{driverName || dc.notAssigned}</span>
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
              <TooltipContent>{dc.call}</TooltipContent>
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
              <TooltipContent>{dc.whatsapp}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
);

export default DriverQuickContact;