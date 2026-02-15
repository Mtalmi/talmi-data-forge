import { Building2, Quote } from 'lucide-react';

const clients = [
  { name: 'BTP Maroc', initials: 'BTP' },
  { name: 'Lafarge', initials: 'LF' },
  { name: 'Ciments du Maroc', initials: 'CM' },
];

export default function SocialProofSection() {
  return (
    <section className="border-t border-border py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <p className="social-heading text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mb-10">
          Trusted by leading concrete operators
        </p>

        {/* Client logos */}
        <div className="social-logos flex flex-wrap items-center justify-center gap-8 sm:gap-14 mb-16">
          {clients.map((c) => (
            <div
              key={c.name}
              className="social-logo flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{c.initials}</span>
              </div>
              <span className="text-sm font-semibold text-foreground/70">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="social-testimonial max-w-2xl mx-auto text-center">
          <Quote className="h-8 w-8 text-primary/30 mx-auto mb-4 rotate-180" />
          <blockquote className="text-lg sm:text-xl font-medium text-foreground/90 leading-relaxed mb-6">
            TBOS reduced our production costs by 15% in 3 months
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary/60" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground/80">Ahmed Benali</p>
              <p className="text-xs text-muted-foreground">Directeur Production, Ciments Casablanca</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
