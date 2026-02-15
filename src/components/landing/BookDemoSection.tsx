import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, Send, Clock, Gift, ShieldCheck, Loader2 } from 'lucide-react';

const badges = [
  { icon: ShieldCheck, label: 'Sans engagement' },
  { icon: Gift, label: 'Gratuit' },
  { icon: Clock, label: 'Réponse 24h' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{7,20}$/;

interface FormErrors {
  nom_complet?: string;
  email?: string;
  telephone?: string;
}

export default function BookDemoSection() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    nom_complet: '',
    email: '',
    telephone: '',
    entreprise: '',
    nombre_centrales: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.nom_complet.trim()) {
      newErrors.nom_complet = 'Le nom complet est requis';
    }

    if (!form.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'Format email invalide';
    }

    if (form.telephone.trim() && !PHONE_REGEX.test(form.telephone.trim())) {
      newErrors.telephone = 'Format téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    toast.loading('Envoi en cours...', { id: 'demo-submit' });

    const { error } = await supabase.from('demo_requests').insert({
      nom_complet: form.nom_complet.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim() || null,
      entreprise: form.entreprise.trim() || null,
      nombre_centrales: form.nombre_centrales ? parseInt(form.nombre_centrales, 10) : null,
    });
    setLoading(false);

    if (error) {
      toast.error("Erreur lors de l'enregistrement. Réessayez.", { id: 'demo-submit' });
      return;
    }

    setSubmitted(true);
    toast.success('Demande envoyée avec succès ✓', { id: 'demo-submit' });
  };

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/60 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4">Démo</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Prêt à transformer{' '}
            <span className="text-gradient-gold">votre centrale</span> ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Réservez une démo personnalisée. Réponse sous 24h.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
              <b.icon className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium text-foreground/80">{b.label}</span>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="max-w-md mx-auto text-center py-12 rounded-2xl bg-card border border-border">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Demande reçue !</h3>
            <p className="text-muted-foreground">Notre équipe vous contactera sous 24h.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4 p-8 rounded-2xl bg-card border border-border"
            noValidate
          >
            <div className="space-y-1">
              <Input name="nom_complet" placeholder="Nom complet *" value={form.nom_complet} onChange={handleChange} required maxLength={100} className={errors.nom_complet ? 'border-destructive' : ''} />
              {errors.nom_complet && <p className="text-xs text-destructive">{errors.nom_complet}</p>}
            </div>
            <div className="space-y-1">
              <Input name="email" type="email" placeholder="Email professionnel *" value={form.email} onChange={handleChange} required maxLength={255} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} maxLength={20} className={errors.telephone ? 'border-destructive' : ''} />
              {errors.telephone && <p className="text-xs text-destructive">{errors.telephone}</p>}
            </div>
            <Input name="entreprise" placeholder="Nom de l'entreprise" value={form.entreprise} onChange={handleChange} maxLength={100} />
            <div className="sm:col-span-2">
              <Input name="nombre_centrales" type="number" min={1} max={100} placeholder="Nombre de centrales" value={form.nombre_centrales} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full text-base py-6 rounded-2xl shadow-[0_4px_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_50px_hsl(var(--primary)/0.45)] transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Réserver ma démo
                    <Send className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
