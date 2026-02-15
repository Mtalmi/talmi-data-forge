import { Building2, Quote, Award, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const clients = [
  { name: 'BTP Maroc', initials: 'BTP' },
  { name: 'Lafarge', initials: 'LF' },
  { name: 'Ciments du Maroc', initials: 'CM' },
  { name: 'SNCE Group', initials: 'SN' },
  { name: 'Al Rajhi Construction', initials: 'AR' },
  { name: 'Emirates Concrete', initials: 'EC' },
];

const certifications = [
  { icon: ShieldCheck, label: 'ISO 27001 Security' },
  { icon: Award, label: 'AWS Partner' },
  { icon: ShieldCheck, label: 'GDPR Compliant' },
  { icon: Award, label: 'SOC 2 Type II' },
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
    {
      quote: (l as any).socialQuote3 || 'TBOS gave us full visibility across 6 plants in the UAE. The CEO dashboard alone justified the investment within the first week.',
      name: (l as any).socialName3 || 'Khalid Al Mansouri',
      title: (l as any).socialRole3 || 'Managing Director',
      company: (l as any).socialCompany3 || 'Gulf Concrete Group',
    },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28 bg-card/30 relative overflow-hidden">
      {/* Luxury ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <p className="social-heading text-xs font-bold uppercase tracking-widest text-primary/70 text-center mb-4">
          {l.socialTitle}
        </p>
        <p className="text-center text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
          Deployed across MENA, serving 500+ daily batches
        </p>

        {/* Client logos */}
        <div className="social-logos flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-16">
          {clients.map((c) => (
            <div
              key={c.name}
              className="social-logo flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border opacity-70 hover:opacity-100 hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)] transition-all duration-300"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-black text-primary">{c.initials}</span>
              </div>
              <span className="text-sm font-semibold text-foreground/70">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Testimonials — 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {testimonials.map((tm, i) => (
            <div
              key={i}
              className="social-testimonial rounded-2xl p-8 bg-card border border-border hover:border-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.06)] transition-all duration-300"
            >
              <Quote className="h-7 w-7 text-primary/50 mb-4 rotate-180" />
              <blockquote className="text-base font-medium text-foreground/85 leading-relaxed mb-6">
                "{tm.quote}"
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

        {/* Certifications bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {certifications.map((cert) => (
            <div key={cert.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
              <cert.icon className="h-4 w-4 text-primary/60" />
              <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">{cert.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
