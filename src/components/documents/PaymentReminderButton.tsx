import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentReminderButtonProps {
  factureId: string;
  clientEmail: string | null;
  clientName: string;
  montantDu: number;
  dateEcheance: string;
  joursRetard: number;
}

export function PaymentReminderButton({
  factureId,
  clientEmail,
  clientName,
  montantDu,
  dateEcheance,
  joursRetard,
}: PaymentReminderButtonProps) {
  const [sending, setSending] = useState(false);
  const { t } = useI18n();
  const pr = t.pages.paymentReminder;

  const sendReminder = async () => {
    if (!clientEmail) {
      toast.error(pr.emailUnavailable);
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          to: clientEmail,
          clientName,
          factureId,
          montantDu,
          dateEcheance,
          joursRetard,
        },
      });

      if (error) throw error;

      toast.success(`${pr.reminderSent} ${clientEmail}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(pr.sendError);
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={sendReminder}
      disabled={sending || !clientEmail}
      className="gap-2"
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          <Mail className="h-4 w-4" />
        </>
      )}
      {pr.remind}
    </Button>
  );
}
