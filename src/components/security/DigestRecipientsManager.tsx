import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, Plus, Trash2, Loader2, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recipient {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export function DigestRecipientsManager() {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_digest_recipients')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRecipients();
    }
  }, [open]);

  const handleAddRecipient = async () => {
    if (!newEmail.trim()) {
      toast.error('Email requis');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('Format email invalide');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('security_digest_recipients')
        .insert({
          email: newEmail.trim().toLowerCase(),
          name: newName.trim() || null,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Cet email existe déjà');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Destinataire ajouté');
      setNewEmail('');
      setNewName('');
      fetchRecipients();
    } catch (error: any) {
      console.error('Error adding recipient:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('security_digest_recipients')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev =>
        prev.map(r => (r.id === id ? { ...r, is_active: !isActive } : r))
      );
      toast.success(isActive ? 'Destinataire désactivé' : 'Destinataire activé');
    } catch (error: any) {
      console.error('Error toggling recipient:', error);
      toast.error('Erreur de mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_digest_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev => prev.filter(r => r.id !== id));
      toast.success('Destinataire supprimé');
    } catch (error: any) {
      console.error('Error deleting recipient:', error);
      toast.error('Erreur de suppression');
    }
  };

  const activeCount = recipients.filter(r => r.is_active).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Destinataires</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Destinataires du Digest
          </DialogTitle>
          <DialogDescription>
            Gérez les personnes qui reçoivent le digest sécurité hebdomadaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Add new recipient form */}
          <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="email@exemple.com"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Nom (optionnel)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              onClick={handleAddRecipient}
              disabled={adding || !newEmail.trim()}
              size="sm"
              className="w-full gap-1.5"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Ajouter
            </Button>
          </div>

          {/* Recipients list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun destinataire configuré</p>
              </div>
            ) : (
              recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    recipient.is_active
                      ? 'bg-background'
                      : 'bg-muted/50 opacity-60'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {recipient.name || recipient.email}
                    </p>
                    {recipient.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {recipient.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Switch
                      checked={recipient.is_active}
                      onCheckedChange={() =>
                        handleToggleActive(recipient.id, recipient.is_active)
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(recipient.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {recipients.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {activeCount} destinataire{activeCount !== 1 ? 's' : ''} actif
              {activeCount !== 1 ? 's' : ''} recevront le digest chaque lundi à
              08h00.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
