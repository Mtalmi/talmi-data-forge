import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Mail, Send, Loader2, AlertTriangle, CheckCircle, MailX } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { logCommunication } from '@/lib/communicationLogger';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface BatchReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devisList: Devis[];
  onSuccess?: () => void;
}

interface DevisWithSelection extends Devis {
  selected: boolean;
  daysUntilExpiration: number;
  hasEmail: boolean;
}

export function BatchReminderDialog({ open, onOpenChange, devisList, onSuccess }: BatchReminderDialogProps) {
  const { t, lang } = useI18n();
  const br = t.batchReminder;
  const c = t.common;
  const dateLocale = getDateLocale(lang);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedDevis, setSelectedDevis] = useState<Map<string, boolean>>(new Map());
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);

  // Filter to only show pending devis with clients
  const allPendingDevis: DevisWithSelection[] = devisList
    .filter(d => d.statut === 'en_attente' && d.client_id)
    .map(d => {
      const hasEmail = !!(d.client?.email);
      return {
        ...d,
        selected: hasEmail ? (selectedDevis.get(d.id) ?? true) : false,
        daysUntilExpiration: d.date_expiration 
          ? differenceInDays(new Date(d.date_expiration), new Date())
          : 999,
        hasEmail,
      };
    })
    .sort((a, b) => {
      // Sort: with email first, then by expiration
      if (a.hasEmail && !b.hasEmail) return -1;
      if (!a.hasEmail && b.hasEmail) return 1;
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });

  const eligibleDevis = allPendingDevis.filter(d => d.hasEmail);
  const noEmailDevis = allPendingDevis.filter(d => !d.hasEmail);
  const selectedCount = eligibleDevis.filter(d => d.selected).length;

  const handleToggleAll = (checked: boolean) => {
    const newSelection = new Map<string, boolean>();
    eligibleDevis.forEach(d => newSelection.set(d.id, checked));
    setSelectedDevis(newSelection);
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    const newSelection = new Map(selectedDevis);
    newSelection.set(id, checked);
    setSelectedDevis(newSelection);
  };

  const handleSend = async () => {
    const toSend = eligibleDevis.filter(d => d.selected);
    
    if (toSend.length === 0) {
      toast.error(br.selectAtLeastOne);
      return;
    }

    setSending(true);
    const success: string[] = [];
    const failed: string[] = [];

    for (const devis of toSend) {
      try {
        const { error } = await supabase.functions.invoke('send-payment-reminder', {
          body: {
            type: 'devis_reminder',
            devis_id: devis.devis_id,
            client_id: devis.client_id,
            custom_message: customMessage || undefined,
          },
        });

        if (error) throw error;
        
        // Log the communication
        await logCommunication({
          clientId: devis.client_id || '',
          type: 'email',
          category: 'devis_reminder',
          referenceId: devis.devis_id,
          referenceTable: 'devis',
          recipient: devis.client?.nom_client,
          subject: `Relance: Devis ${devis.devis_id}`,
          messagePreview: customMessage || 'Rappel automatique pour devis en attente',
          status: 'sent',
        });
        
        success.push(devis.devis_id);
      } catch (error: any) {
        console.error(`Failed to send reminder for ${devis.devis_id}:`, error);
        // Extract meaningful error message
        const errorMsg = error?.context?.body ? 
          JSON.parse(error.context.body)?.error : 
          error?.message || br.unknownError;
        failed.push(`${devis.devis_id} (${errorMsg})`);
      }
    }

    setResults({ success, failed });
    setSending(false);

    if (success.length > 0) {
      toast.success(`${success.length} ${br.remindersSent}`);
      onSuccess?.();
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} ${br.sendsFailed}`);
    }
  };

  const handleClose = () => {
    setResults(null);
    setSelectedDevis(new Map());
    setCustomMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {br.batchQuoteReminder}
          </DialogTitle>
          <DialogDescription>{br.sendReminders}</DialogDescription>
        </DialogHeader>

        {results ? (
          // Results view
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">{br.sent}</span>
                </div>
                <p className="text-2xl font-bold">{results.success.length}</p>
                {results.success.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{results.success.join(', ')}</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">{br.failures}</span>
                </div>
                <p className="text-2xl font-bold">{results.failed.length}</p>
                {results.failed.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{results.failed.join(', ')}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>{c.close}</Button>
            </DialogFooter>
          </div>
        ) : (
          // Selection view
          <>
            <div className="space-y-4">
              {/* Custom message */}
              <div className="space-y-2">
                <Label htmlFor="custom-message">{br.customMessage}</Label>
                <Textarea
                  id="custom-message"
                  placeholder={br.addCustomMessage}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="h-20"
                />
              </div>

              <Separator />

              {/* Devis list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{br.quotesToRemind} ({selectedCount} {br.selected}{selectedCount > 1 ? 's' : ''})</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCount === eligibleDevis.length}
                      onCheckedChange={handleToggleAll}
                    />
                    <span className="text-sm text-muted-foreground">{br.selectAll}</span>
                  </div>
                </div>

                <ScrollArea className="h-64 border rounded-lg">
                  {eligibleDevis.length === 0 && noEmailDevis.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {br.noPendingQuotes}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {/* Eligible devis with email */}
                      {eligibleDevis.map((devis) => (
                        <div
                          key={devis.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={devis.selected}
                            onCheckedChange={(checked) => 
                              handleToggleOne(devis.id, !!checked)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">
                                {devis.devis_id}
                              </span>
                              {devis.daysUntilExpiration <= 3 && (
                                <Badge 
                                  variant="outline" 
                                  className={
                                    devis.daysUntilExpiration < 0 
                                      ? 'bg-destructive/10 text-destructive border-destructive/30'
                                      : 'bg-warning/10 text-warning border-warning/30'
                                  }
                                >
                                  {devis.daysUntilExpiration < 0 
                                    ? br.expired
                                    : devis.daysUntilExpiration === 0 
                                      ? br.expiresToday
                                      : `${devis.daysUntilExpiration}j`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {devis.client?.nom_client} · {devis.total_ht.toLocaleString()} DH
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(devis.created_at), 'dd/MM', { locale: dateLocale || undefined })}
                          </span>
                        </div>
                      ))}
                      
                      {/* Devis without email - disabled with warning */}
                      {noEmailDevis.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-warning/10 border-t border-warning/30">
                            <div className="flex items-center gap-2 text-sm text-warning">
                              <MailX className="h-4 w-4" />
                              <span className="font-medium">
                                {noEmailDevis.length} {br.clientsNoEmail}
                              </span>
                            </div>
                          </div>
                          {noEmailDevis.map((devis) => (
                            <div
                              key={devis.id}
                              className="flex items-center gap-3 p-3 opacity-50 bg-muted/30"
                            >
                              <Checkbox disabled checked={false} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-muted-foreground">
                                    {devis.devis_id}
                                  </span>
                                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                                    <MailX className="h-3 w-3 mr-1" />
                                    {br.noEmail}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {devis.client?.nom_client} · {devis.total_ht.toLocaleString()} DH
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>{c.cancel}</Button>
              <Button 
                onClick={handleSend} 
                disabled={sending || selectedCount === 0}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {br.sending}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {br.sendReminder} {selectedCount} {selectedCount > 1 ? br.reminders : br.reminder}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
