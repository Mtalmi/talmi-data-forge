import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Factory, Truck, BarChart3, Shield, FlaskConical, Users,
  ArrowRight, Sparkles, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Factory,
    title: 'Production',
    desc: 'Gérez vos batches en temps réel, suivez les écarts et optimisez vos formules.',
    path: '/production',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Truck,
    title: 'Logistique',
    desc: 'Suivez votre flotte, planifiez les rotations et optimisez les temps de livraison.',
    path: '/logistique',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Finances',
    desc: 'Tableau de bord financier complet : ventes, dépenses, créances et trésorerie.',
    path: '/ventes',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: FlaskConical,
    title: 'Laboratoire',
    desc: 'Contrôle qualité, tests d\'affaissement et conformité des formules béton.',
    path: '/laboratoire',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Sécurité',
    desc: 'Audit forensique, RLS enterprise et traçabilité complète des actions.',
    path: '/securite',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Users,
    title: 'Équipe',
    desc: 'Gestion des rôles, pointage et certifications de l\'ensemble du personnel.',
    path: '/pointage',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const ONBOARDING_KEY = 'tbos_onboarding_shown_v2';

export function WelcomeOnboardingModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const shown = localStorage.getItem(ONBOARDING_KEY);
    if (!shown) {
      // Small delay to let dashboard render first
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Bienvenue sur TBOS</h2>
              <p className="text-sm text-muted-foreground">Explorez les modules clés de votre centrale</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="px-6 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-3 tbos-stagger-enter">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => handleNavigate(f.path)}
              className={cn(
                "group text-left p-4 rounded-xl border border-border/50 transition-all duration-200",
                "hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]",
                "bg-card/50"
              )}
            >
              <div className={cn("p-2 rounded-lg w-fit mb-3", f.bg)}>
                <f.icon className={cn("h-5 w-5", f.color)} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{f.desc}</p>
            </button>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Cliquez sur un module pour commencer
          </p>
          <Button size="sm" variant="ghost" onClick={handleClose}>
            Explorer seul <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
