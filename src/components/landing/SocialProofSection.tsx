import { Building2, Quote } from 'lucide-react';

const clients = [
  { name: 'BTP Maroc', initials: 'BTP' },
  { name: 'Lafarge', initials: 'LF' },
  { name: 'Ciments du Maroc', initials: 'CM' },
  { name: 'SNCE Group', initials: 'SN' },
];

const testimonials = [
  {
    quote: 'TBOS a réduit nos coûts de production de 15% en 3 mois. La visibilité en temps réel sur chaque toupie a tout changé.',
    name: 'Ahmed Benali',
    title: 'Directeur Production',
    company: 'Ciments Casablanca',
  },
  {
    quote: 'Avant TBOS, on perdait 2h par jour sur le suivi logistique. Aujourd\'hui tout est automatisé, du bon de commande à la facture.',
    name: 'Fatima Zahra El Idrissi',
    title: 'Directrice Financière',
    company: 'BTP Maroc Group',
  },
];

export default function SocialProofSection() {
  return (
    <section className="border-t border-border py-20 sm:py-24 bg-card/30">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <p className="social-heading text-xs font-bold uppercase tracking-widest text-primary/70 text-center mb-12">
          Ils nous font confiance
        </p>

        {/* Client logos */}
        <div className="social-logos flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-16">
          {clients.map((c) => (
            <div
              key={c.name}
              className="social-logo flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border opacity-70 hover:opacity-100 hover:border-primary/20 transition-all duration-300"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-black text-primary">{c.initials}</span>
              </div>
              <span className="text-sm font-semibold text-foreground/70">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="social-testimonial rounded-2xl p-8 bg-card border border-border hover:border-primary/20 transition-all duration-300"
            >
              <Quote className="h-7 w-7 text-primary/50 mb-4 rotate-180" />
              <blockquote className="text-base font-medium text-foreground/85 leading-relaxed mb-6">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-primary/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/80">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}, {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
