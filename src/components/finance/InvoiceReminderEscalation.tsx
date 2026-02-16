import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail, Send, Loader2, AlertTriangle, CheckCircle, Clock,
  Phone, MessageSquare, TrendingUp, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface OverdueInvoice {
  facture_id: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  total_ttc: number;
  date_facture: string;
  days_overdue: number;
  last_reminder_level: number;
  selected: boolean;
}

interface InvoiceReminderEscalationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ESCALATION_LEVELS = [
  { level: 1, label: 'Rappel Courtois (J+7)', delay: 7, icon: Mail, color: 'text-primary', bgColor: 'bg-primary/10' },
  { level: 2, label: 'Relance Ferme (J+15)', delay: 15, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
  { level: 3, label: 'Mise en Demeure (J+30)', delay: 30, icon: Zap, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

const REMINDER_TEMPLATES: Record<number, string> = {
  1: `Bonjour,\n\nNous nous permettons de vous rappeler que la facture {facture_id} d'un montant de {montant} DH, émise le {date}, est arrivée à échéance.\n\nNous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.\n\nCordialement,\nTALMI BETON`,
  2: `Bonjour,\n\nSauf erreur de notre part, la facture {facture_id} d'un montant de {montant} DH reste impayée depuis {jours} jours.\n\nNous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais. À défaut, nous serons contraints d'appliquer les pénalités de retard prévues par la loi 32-10.\n\nCordialement,\nTALMI BETON`,
  3: `Madame, Monsieur,\n\nMalgré nos relances précédentes, la facture {facture_id} d'un montant de {montant} DH demeure impayée depuis {jours} jours.\n\nLa présente constitue une mise en demeure formelle. Sans règlement sous 8 jours, nous serons dans l'obligation de transmettre le dossier à notre service contentieux.\n\nPénalités applicables: 1.5%/mois (Loi 32-10).\n\nTALMI BETON SARL`,
};

export function InvoiceReminderEscalation({ open, onOpenChange, onSuccess }: InvoiceReminderEscalationProps) {
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const fetchOverdueInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch unpaid invoices
      const { data: facturesData } = await supabase
        .from('factures')
        .select('facture_id, client_id, total_ttc, date_facture')
        .in('statut', ['emise', 'envoyee', 'retard'])
        .order('date_facture', { ascending: true });

      if (!facturesData || facturesData.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      // Fetch client info
      const clientIds = [...new Set(facturesData.map(f => f.client_id))];
      const { data: clientsData } = await supabase
        .from('clients')
        .select('client_id, nom_client, email, telephone')
        .in('client_id', clientIds);

      const clientMap = new Map(clientsData?.map(c => [c.client_id, c]) || []);

      // Fetch existing reminders to determine escalation level
      const factureIds = facturesData.map(f => f.facture_id);
      const { data: remindersData } = await supabase
        .from('relances_factures')
        .select('facture_id, niveau_relance')
        .in('facture_id', factureIds)
        .order('niveau_relance', { ascending: false });

      const maxReminderMap = new Map<string, number>();
      remindersData?.forEach(r => {
        if (!maxReminderMap.has(r.facture_id)) {
          maxReminderMap.set(r.facture_id, r.niveau_relance);
        }
      });

      const today = new Date();
      const overdueList: OverdueInvoice[] = facturesData
        .map(f => {
          const daysOverdue = differenceInDays(today, new Date(f.date_facture));
          const client = clientMap.get(f.client_id);
          const lastLevel = maxReminderMap.get(f.facture_id) || 0;

          return {
            facture_id: f.facture_id,
            client_id: f.client_id,
            client_name: client?.nom_client || 'N/A',
            client_email: client?.email || undefined,
            client_phone: client?.telephone || undefined,
            total_ttc: f.total_ttc,
            date_facture: f.date_facture,
            days_overdue: daysOverdue,
            last_reminder_level: lastLevel,
            selected: !!client?.email && daysOverdue >= 7,
          };
        })
        .filter(f => f.days_overdue >= 7)
        .sort((a, b) => b.days_overdue - a.days_overdue);

      setInvoices(overdueList);
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchOverdueInvoices();
  }, [open, fetchOverdueInvoices]);

  const getNextLevel = (invoice: OverdueInvoice): number => {
    if (invoice.days_overdue >= 30 && invoice.last_reminder_level < 3) return 3;
    if (invoice.days_overdue >= 15 && invoice.last_reminder_level < 2) return 2;
    if (invoice.last_reminder_level < 1) return 1;
    return Math.min(invoice.last_reminder_level + 1, 3);
  };

  const handleToggle = (factureId: string, checked: boolean) => {
    setInvoices(prev => prev.map(i =>
      i.facture_id === factureId ? { ...i, selected: checked } : i
    ));
  };

  const handleSendAll = async () => {
    const toSend = invoices.filter(i => i.selected && i.client_email);
    if (toSend.length === 0) {
      toast.error('Aucune facture sélectionnée avec email client');
      return;
    }

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const invoice of toSend) {
      try {
        const nextLevel = getNextLevel(invoice);
        const template = REMINDER_TEMPLATES[nextLevel] || REMINDER_TEMPLATES[1];
        const message = template
          .replace('{facture_id}', invoice.facture_id)
          .replace('{montant}', invoice.total_ttc.toLocaleString('fr-FR'))
          .replace('{date}', format(new Date(invoice.date_facture), 'dd/MM/yyyy'))
          .replace('{jours}', String(invoice.days_overdue));

        // Try sending via edge function
        await supabase.functions.invoke('send-payment-reminder', {
          body: {
            type: 'invoice_reminder',
            facture_id: invoice.facture_id,
            client_id: invoice.client_id,
            level: nextLevel,
            custom_message: message,
          },
        });

        // Log the reminder
        await supabase.from('relances_factures').insert({
          facture_id: invoice.facture_id,
          client_id: invoice.client_id,
          niveau_relance: nextLevel,
          type_relance: 'email',
          message,
          statut: 'envoyee',
          date_prochaine_relance: nextLevel < 3
            ? new Date(Date.now() + (nextLevel === 1 ? 8 : 15) * 86400000).toISOString()
            : null,
        });

        // Update facture status to retard if level >= 2
        if (nextLevel >= 2) {
          await supabase.from('factures').update({ statut: 'retard' }).eq('facture_id', invoice.facture_id);
        }

        sent++;
      } catch (error) {
        console.error(`Failed for ${invoice.facture_id}:`, error);
        failed++;
      }
    }

    setResults({ sent, failed });
    setSending(false);

    if (sent > 0) {
      toast.success(`${sent} relance(s) envoyée(s)`);
      onSuccess?.();
    }
    if (failed > 0) toast.error(`${failed} échec(s)`);
  };

  const selectedCount = invoices.filter(i => i.selected).length;
  const totalAmount = invoices.filter(i => i.selected).reduce((s, i) => s + i.total_ttc, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Relances Automatiques — Escalade
          </DialogTitle>
        </DialogHeader>

        {/* Escalation Legend */}
        <div className="flex flex-wrap gap-2">
          {ESCALATION_LEVELS.map(level => (
            <Badge key={level.level} variant="outline" className={cn('gap-1', level.bgColor, level.color)}>
              <level.icon className="h-3 w-3" />
              {level.label}
            </Badge>
          ))}
        </div>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{results.sent}</p>
                <p className="text-sm text-muted-foreground">Envoyées</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold">{results.failed}</p>
                <p className="text-sm text-muted-foreground">Échecs</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => { setResults(null); onOpenChange(false); }}>
              Fermer
            </Button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-semibold text-success">Aucune facture en retard</p>
            <p className="text-sm text-muted-foreground">Tous les paiements sont à jour.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} sélectionnées • {totalAmount.toLocaleString()} DH
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInvoices(prev => prev.map(i => ({ ...i, selected: !!i.client_email })))}
              >
                Tout sélectionner
              </Button>
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {invoices.map(invoice => {
                  const nextLevel = getNextLevel(invoice);
                  const levelConfig = ESCALATION_LEVELS[nextLevel - 1];

                  return (
                    <div
                      key={invoice.facture_id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        invoice.selected ? 'border-primary/30 bg-primary/5' : 'border-border/40',
                        !invoice.client_email && 'opacity-50'
                      )}
                    >
                      <Checkbox
                        checked={invoice.selected}
                        disabled={!invoice.client_email}
                        onCheckedChange={(c) => handleToggle(invoice.facture_id, !!c)}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sm">{invoice.facture_id}</span>
                          <Badge variant="outline" className={cn('text-[10px] gap-0.5', levelConfig.bgColor, levelConfig.color)}>
                            <levelConfig.icon className="h-2.5 w-2.5" />
                            Niv. {nextLevel}
                          </Badge>
                          {invoice.last_reminder_level > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              Déjà {invoice.last_reminder_level}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.client_name} • {invoice.total_ttc.toLocaleString()} DH • {invoice.days_overdue}j
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {invoice.client_email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                        {invoice.client_phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        {!results && invoices.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button
              onClick={handleSendAll}
              disabled={sending || selectedCount === 0}
              className="gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer {selectedCount} relance(s)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
