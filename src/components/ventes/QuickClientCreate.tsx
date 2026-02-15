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
import { useI18n } from '@/i18n/I18nContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{7,20}$/;

interface QuickClientCreateProps {
  onClientCreated: (clientId: string, clientName: string) => void;
}

interface FormErrors {
  nomClient?: string;
  email?: string;
  telephone?: string;
}

export function QuickClientCreate({ onClientCreated }: QuickClientCreateProps) {
  const { t } = useI18n();
  const qc = t.quickClientCreate;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
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
    setErrors({});
  };

  const generateClientId = () => {
    const prefix = 'CLI';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!nomClient.trim()) {
      newErrors.nomClient = qc.nameRequired;
    }
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      newErrors.email = qc.invalidEmail;
    }
    if (telephone.trim() && !PHONE_REGEX.test(telephone.trim())) {
      newErrors.telephone = qc.invalidPhone;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    toast.loading(qc.creatingProgress, { id: 'client-create' });

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

      toast.success(qc.clientAdded, { id: 'client-create' });
      onClientCreated(clientId, nomClient.trim());
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(qc.saveError, { id: 'client-create' });
    } finally {
      setSaving(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" title={qc.newClient}>
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {qc.newClient}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="nom_client" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {qc.nameSociety}
            </Label>
            <Input
              id="nom_client"
              value={nomClient}
              onChange={(e) => { setNomClient(e.target.value); clearError('nomClient'); }}
              placeholder="Ex: TGCC Construction"
              autoFocus
              className={errors.nomClient ? 'border-destructive' : ''}
            />
            {errors.nomClient && <p className="text-xs text-destructive">{errors.nomClient}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {qc.contact}
              </Label>
              <Input
                id="contact"
                value={contactPersonne}
                onChange={(e) => setContactPersonne(e.target.value)}
                placeholder={qc.contactPlaceholder}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telephone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {qc.phone}
              </Label>
              <Input
                id="telephone"
                value={telephone}
                onChange={(e) => { setTelephone(e.target.value); clearError('telephone'); }}
                placeholder="06 XX XX XX XX"
                className={errors.telephone ? 'border-destructive' : ''}
              />
              {errors.telephone && <p className="text-xs text-destructive">{errors.telephone}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {qc.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
              placeholder="contact@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {qc.address}
            </Label>
            <Input
              id="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder={qc.addressPlaceholder}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {qc.cancel}
            </Button>
            <Button type="submit" disabled={saving || !nomClient.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {qc.creating}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {qc.createClient}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
