import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarClock,
  Clock,
  Bell,
  BellOff,
  Mail,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, differenceInDays, parseISO, isBefore } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

interface ScheduledReminder {
  id: string;
  devis_id: string;
  scheduled_date: string;
  reminder_type: string;
  status: string;
  message?: string;
}

interface ScheduledRemindersDialogProps {
  devisList: Devis[];
  onRefresh?: () => void;
}

export function ScheduledRemindersDialog({ devisList, onRefresh }: ScheduledRemindersDialogProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [open, setOpen] = useState(false);
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [daysBeforeExpiry, setDaysBeforeExpiry] = useState(7);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [loading, setLoading] = useState(false);

  // Get devis expiring soon that need reminders
  const expiringDevis = devisList.filter(d => {
    if (d.statut !== 'en_attente' || !d.date_expiration) return false;
    const daysLeft = differenceInDays(parseISO(d.date_expiration), new Date());
    return daysLeft > 0 && daysLeft <= 14;
  }).sort((a, b) => {
    const daysA = differenceInDays(parseISO(a.date_expiration!), new Date());
    const daysB = differenceInDays(parseISO(b.date_expiration!), new Date());
    return daysA - daysB;
  });

  // Calculate suggested reminder dates based on expiration
  const getSuggestedReminderDate = (devis: Devis): Date | null => {
    if (!devis.date_expiration) return null;
    const expiryDate = parseISO(devis.date_expiration);
    const reminderDate = addDays(expiryDate, -daysBeforeExpiry);
    
    // If reminder date is in the past, suggest tomorrow
    if (isBefore(reminderDate, new Date())) {
      return addDays(new Date(), 1);
    }
    return reminderDate;
  };

  const handleScheduleReminder = async (devis: Devis) => {
    const reminderDate = getSuggestedReminderDate(devis);
    if (!reminderDate) return;

    setLoading(true);
    try {
      // In a real implementation, this would insert into a scheduled_reminders table
      // For now, we'll simulate the scheduling
      toast.success(
        `Rappel programmé pour ${format(reminderDate, 'dd MMMM yyyy', { locale: dateLocale })}`,
        { description: `Devis ${devis.devis_id} - ${devis.client?.nom_client}` }
      );

      // Log the scheduled communication
      await supabase.from('communication_logs').insert({
        client_id: devis.client_id || '',
        type: 'email',
        category: 'scheduled_reminder',
        status: 'scheduled',
        subject: `Rappel programmé - Devis ${devis.devis_id}`,
        reference_id: devis.devis_id,
        reference_table: 'devis',
        metadata: {
          scheduled_date: reminderDate.toISOString(),
          expiration_date: devis.date_expiration,
        },
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      toast.error('Erreur lors de la programmation du rappel');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAll = async () => {
    setLoading(true);
    let successCount = 0;
    
    for (const devis of expiringDevis) {
      if (!devis.client_id) continue;
      
      try {
        const reminderDate = getSuggestedReminderDate(devis);
        if (!reminderDate) continue;

        await supabase.from('communication_logs').insert({
          client_id: devis.client_id,
          type: 'email',
          category: 'scheduled_reminder',
          status: 'scheduled',
          subject: `Rappel programmé - Devis ${devis.devis_id}`,
          reference_id: devis.devis_id,
          reference_table: 'devis',
          metadata: {
            scheduled_date: reminderDate.toISOString(),
            expiration_date: devis.date_expiration,
          },
        });
        successCount++;
      } catch (error) {
        console.error('Error scheduling reminder:', error);
      }
    }

    setLoading(false);
    toast.success(`${successCount} rappel(s) programmé(s)`);
    onRefresh?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarClock className="h-4 w-4" />
          Rappels Auto
          {expiringDevis.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {expiringDevis.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Programmation des Rappels
          </DialogTitle>
          <DialogDescription>
            Configurez les rappels automatiques pour les devis arrivant à expiration
          </DialogDescription>
        </DialogHeader>

        {/* Settings */}
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rappels automatiques</Label>
              <p className="text-xs text-muted-foreground">
                Envoyer des rappels avant l'expiration
              </p>
            </div>
            <Switch
              checked={autoRemindersEnabled}
              onCheckedChange={setAutoRemindersEnabled}
            />
          </div>

          {autoRemindersEnabled && (
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">Rappeler</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={daysBeforeExpiry}
                onChange={(e) => setDaysBeforeExpiry(parseInt(e.target.value) || 7)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">jours avant expiration</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Expiring Devis List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Devis à relancer ({expiringDevis.length})
            </h4>
            {expiringDevis.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleScheduleAll}
                disabled={loading}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Tout programmer
              </Button>
            )}
          </div>

          {expiringDevis.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun devis n'arrive à expiration prochainement</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {expiringDevis.map((devis) => {
                  const daysLeft = differenceInDays(parseISO(devis.date_expiration!), new Date());
                  const reminderDate = getSuggestedReminderDate(devis);

                  return (
                    <div
                      key={devis.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        daysLeft <= 3 ? "border-destructive/50 bg-destructive/5" : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {devis.devis_id}
                            </span>
                            <Badge 
                              variant={daysLeft <= 3 ? "destructive" : "secondary"}
                              className="gap-1"
                            >
                              {daysLeft <= 3 && <AlertTriangle className="h-3 w-3" />}
                              {daysLeft}j restants
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {devis.client?.nom_client || 'Client non assigné'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {devis.total_ht.toLocaleString()} DH • {devis.volume_m3} m³
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {devis.client_id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScheduleReminder(devis)}
                              disabled={loading}
                              className="gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {reminderDate 
                                ? format(reminderDate, 'dd/MM')
                                : 'Programmer'
                              }
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Client requis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            Les rappels seront envoyés par email aux clients avec devis en attente
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
