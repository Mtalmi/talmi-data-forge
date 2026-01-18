import { useState } from 'react';
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

  const sendReminder = async () => {
    if (!clientEmail) {
      toast.error('Email du client non disponible');
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

      toast.success(`Rappel envoyé à ${clientEmail}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Erreur lors de l\'envoi du rappel');
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
      Relancer
    </Button>
  );
}
