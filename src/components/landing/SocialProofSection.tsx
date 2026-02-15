import { Building2, Quote } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const clients = [
  { name: 'BTP Maroc', initials: 'BTP' },
  { name: 'Lafarge', initials: 'LF' },
  { name: 'Ciments du Maroc', initials: 'CM' },
  { name: 'SNCE Group', initials: 'SN' },
];

export default function SocialProofSection() {
  const { t } = useI18n();
  const l = t.landing;

  const testimonials = [
    {
      quote: l.socialQuote1,
      name: l.socialName1,
      title: l.socialRole1,
      company: l.socialCompany1,
    },
    {
      quote: l.socialQuote2,
      name: l.socialName2,
      title: l.socialRole2,
      company: l.socialCompany2,
    },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-24 bg-card/30">
      <div className="max-w-6xl mx-auto px-6">
        <p className="social-heading text-xs font-bold uppercase tracking-widest text-primary/70 text-center mb-12">
          {l.socialTitle}
        </p>

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

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((tm, i) => (
            <div
              key={i}
              className="social-testimonial rounded-2xl p-8 bg-card border border-border hover:border-primary/20 transition-all duration-300"
            >
              <Quote className="h-7 w-7 text-primary/50 mb-4 rotate-180" />
              <blockquote className="text-base font-medium text-foreground/85 leading-relaxed mb-6">
                {tm.quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-primary/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/80">{tm.name}</p>
                  <p className="text-xs text-muted-foreground">{tm.title}, {tm.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
