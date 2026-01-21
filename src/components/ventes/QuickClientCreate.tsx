import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Loader2, User, Building, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface QuickClientCreateProps {
  onClientCreated: (clientId: string, clientName: string) => void;
}

export function QuickClientCreate({ onClientCreated }: QuickClientCreateProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [nomClient, setNomClient] = useState('');
  const [contactPersonne, setContactPersonne] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');

  const resetForm = () => {
    setNomClient('');
    setContactPersonne('');
    setTelephone('');
    setEmail('');
    setAdresse('');
  };

  const generateClientId = () => {
    const prefix = 'CLI';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomClient.trim()) {
      toast.error('Le nom du client est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const clientId = generateClientId();
      
      const { error } = await supabase.from('clients').insert({
        client_id: clientId,
        nom_client: nomClient.trim(),
        contact_personne: contactPersonne.trim() || null,
        telephone: telephone.trim() || null,
        email: email.trim() || null,
        adresse: adresse.trim() || null,
      });

      if (error) throw error;

      toast.success(`Client "${nomClient}" créé avec succès`);
      onClientCreated(clientId, nomClient.trim());
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erreur lors de la création du client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" title="Nouveau client">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Nouveau Client
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom_client" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              Nom / Société *
            </Label>
            <Input
              id="nom_client"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Ex: TGCC Construction"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Contact
              </Label>
              <Input
                id="contact"
                value={contactPersonne}
                onChange={(e) => setContactPersonne(e.target.value)}
                placeholder="Nom du contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Téléphone
              </Label>
              <Input
                id="telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 XX XX XX XX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Adresse
            </Label>
            <Input
              id="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Adresse du client"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !nomClient.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
