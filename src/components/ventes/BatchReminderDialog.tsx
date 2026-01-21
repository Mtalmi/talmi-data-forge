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
import { Mail, Send, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BatchReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devisList: Devis[];
  onSuccess?: () => void;
}

interface DevisWithSelection extends Devis {
  selected: boolean;
  daysUntilExpiration: number;
}

export function BatchReminderDialog({ 
  open, 
  onOpenChange, 
  devisList,
  onSuccess 
}: BatchReminderDialogProps) {
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedDevis, setSelectedDevis] = useState<Map<string, boolean>>(new Map());
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);

  // Filter to only show pending devis with clients and email
  const eligibleDevis: DevisWithSelection[] = devisList
    .filter(d => d.statut === 'en_attente' && d.client_id)
    .map(d => ({
      ...d,
      selected: selectedDevis.get(d.id) ?? true,
      daysUntilExpiration: d.date_expiration 
        ? differenceInDays(new Date(d.date_expiration), new Date())
        : 999,
    }))
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

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
      toast.error('Veuillez sélectionner au moins un devis');
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
        success.push(devis.devis_id);
      } catch (error) {
        console.error(`Failed to send reminder for ${devis.devis_id}:`, error);
        failed.push(devis.devis_id);
      }
    }

    setResults({ success, failed });
    setSending(false);

    if (success.length > 0) {
      toast.success(`${success.length} relance(s) envoyée(s) avec succès`);
      onSuccess?.();
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} envoi(s) échoué(s)`);
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
            Relance Groupée des Devis
          </DialogTitle>
          <DialogDescription>
            Envoyez des rappels par email aux clients avec des devis en attente.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          // Results view
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">Envoyés</span>
                </div>
                <p className="text-2xl font-bold">{results.success.length}</p>
                {results.success.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.success.join(', ')}
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Échecs</span>
                </div>
                <p className="text-2xl font-bold">{results.failed.length}</p>
                {results.failed.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.failed.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          // Selection view
          <>
            <div className="space-y-4">
              {/* Custom message */}
              <div className="space-y-2">
                <Label htmlFor="custom-message">Message personnalisé (optionnel)</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Ajoutez un message personnalisé à inclure dans l'email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="h-20"
                />
              </div>

              <Separator />

              {/* Devis list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Devis à relancer ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCount === eligibleDevis.length}
                      onCheckedChange={handleToggleAll}
                    />
                    <span className="text-sm text-muted-foreground">Tout sélectionner</span>
                  </div>
                </div>

                <ScrollArea className="h-64 border rounded-lg">
                  {eligibleDevis.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Aucun devis en attente avec client assigné
                    </div>
                  ) : (
                    <div className="divide-y">
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
                                    ? 'Expiré'
                                    : devis.daysUntilExpiration === 0 
                                      ? "Expire aujourd'hui"
                                      : `${devis.daysUntilExpiration}j`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {devis.client?.nom_client} · {devis.total_ht.toLocaleString()} DH
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(devis.created_at), 'dd/MM', { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={sending || selectedCount === 0}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer {selectedCount} relance{selectedCount > 1 ? 's' : ''}
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
