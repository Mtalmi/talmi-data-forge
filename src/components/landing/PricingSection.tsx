import { CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    name: 'Starter',
    price: '2 900',
    unit: 'DH/mois',
    description: '1 centrale',
    popular: false,
    features: [
      'Production & Planning',
      'Livraisons & GPS',
      'Stocks basiques',
      'Support email',
    ],
    cta: 'Commencer',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Professional',
    price: '5 900',
    unit: 'DH/mois',
    description: "Jusqu'à 3 centrales",
    popular: true,
    features: [
      'Tout Starter +',
      'Finance & Devis',
      'Laboratoire & Qualité',
      'Rapports avancés',
      'Support prioritaire',
    ],
    cta: 'Essai gratuit 14 jours',
    ctaVariant: 'default' as const,
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    unit: '',
    description: '4+ centrales',
    popular: false,
    features: [
      'Tout Professional +',
      'Multi-sites unifié',
      'API & Intégrations',
      'IA & Prédictions',
      'Support dédié 24/7',
    ],
    cta: "Contacter l'équipe",
    ctaVariant: 'outline' as const,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="pricing-heading text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4">Tarifs</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Un plan pour chaque{' '}
            <span className="text-gradient-gold">ambition</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Transparent. Sans engagement. Scalable.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`
                pricing-card relative rounded-2xl p-8 transition-all duration-300
                ${tier.popular
                  ? 'bg-card border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.15)] scale-[1.03] lg:scale-105'
                  : 'bg-card border border-border hover:border-primary/25 hover:shadow-glow-sm'
                }
              `}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Le plus populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold tracking-tight mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl sm:text-5xl font-black text-gradient-gold">{tier.price}</span>
                {tier.unit && (
                  <span className="text-sm text-muted-foreground ml-2">{tier.unit}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.ctaVariant}
                size="lg"
                className={`w-full rounded-2xl py-6 ${tier.popular ? 'shadow-[0_4px_30px_hsl(var(--primary)/0.3)]' : ''}`}
                onClick={() => navigate('/auth')}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
