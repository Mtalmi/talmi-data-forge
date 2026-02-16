import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Shield, Factory, Truck, FlaskConical, BarChart3,
  Zap, Lock, Globe, ArrowRight, CheckCircle2,
  Building2, Users, TrendingUp, Eye, Play, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import heroPlantNight from '@/assets/hero_plant_night.jpg';
import statsTexture from '@/assets/stats-texture.jpg';
import modulesBg from '@/assets/modules-bg.jpg';
import PricingSection from '@/components/landing/PricingSection';
import BookDemoSection from '@/components/landing/BookDemoSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import GulfTrustBar from '@/components/landing/GulfTrustBar';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const l = t.landing;
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        toast.error('Erreur lors de la connexion démo');
        return;
      }
      // Set the session in supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      toast.success('Bienvenue en mode démo !');
      navigate('/');
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setDemoLoading(false);
    }
  };

  const stats = [
    { value: '50+', label: l.statModules, icon: Zap, num: 50, suffix: '+' },
    { value: '99.9%', label: l.statUptime, icon: Shield, num: 99.9, suffix: '%', decimals: 1 },
    { value: '< 2s', label: l.statLoadTime, icon: TrendingUp, num: 2, suffix: 's', prefix: '< ' },
    { value: 'AES-256', label: l.statEncryption, icon: Lock, num: 256, prefix: 'AES-' },
  ];

  const features = [
    { icon: Factory, title: l.featProductionTitle, desc: l.featProductionDesc },
    { icon: Truck, title: l.featFleetTitle, desc: l.featFleetDesc },
    { icon: BarChart3, title: l.featFinanceTitle, desc: l.featFinanceDesc },
    { icon: FlaskConical, title: l.featLabTitle, desc: l.featLabDesc },
    { icon: Eye, title: l.featCeoTitle, desc: l.featCeoDesc },
    { icon: Users, title: l.featRolesTitle, desc: l.featRolesDesc },
  ];

  const trusted = [l.trustIso, l.trustGdpr, l.trustSoc, l.trustMulti];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from('.hero-badge', { opacity: 0, y: 30, duration: 0.7, delay: 0.2 });
      gsap.from('.hero-headline', { opacity: 0, y: 40, duration: 0.9, delay: 0.35 });
      gsap.from('.hero-subtitle', { opacity: 0, y: 25, duration: 0.7, delay: 0.55 });
      gsap.from('.hero-cta', { opacity: 0, y: 25, duration: 0.6, delay: 0.7 });
      gsap.from('.hero-scroll', { opacity: 0, duration: 0.5, delay: 1.5 });

      // Stat cards scroll-in + number counting
      gsap.utils.toArray<HTMLElement>('.stat-card').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 40, duration: 0.6, delay: i * 0.12,
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        });

        const numEl = card.querySelector('.stat-num');
        if (numEl) {
          const target = parseFloat(numEl.getAttribute('data-target') || '0');
          const decimals = parseInt(numEl.getAttribute('data-decimals') || '0');
          const prefix = numEl.getAttribute('data-prefix') || '';
          const suffix = numEl.getAttribute('data-suffix') || '';
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target, duration: 1.8, ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
            onUpdate: () => {
              numEl.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
            },
          });
        }
      });

      // Features heading
      gsap.from('.features-heading', {
        opacity: 0, y: 30, duration: 0.7,
        scrollTrigger: { trigger: '.features-heading', start: 'top 85%' },
      });

      // Feature cards staggered
      gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 50, duration: 0.6, delay: i * 0.08,
          scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      // Pricing section
      gsap.from('.pricing-heading', {
        opacity: 0, y: 30, duration: 0.7,
        scrollTrigger: { trigger: '.pricing-heading', start: 'top 85%' },
      });
      gsap.utils.toArray<HTMLElement>('.pricing-card').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 50, duration: 0.6, delay: i * 0.12,
          scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      // Trust bar items
      gsap.from('.trust-heading', {
        opacity: 0, y: 20, duration: 0.5,
        scrollTrigger: { trigger: '.trust-heading', start: 'top 88%' },
      });
      gsap.utils.toArray<HTMLElement>('.trust-item').forEach((item, i) => {
        gsap.from(item, {
          opacity: 0, scale: 0.85, duration: 0.4, delay: i * 0.1,
          scrollTrigger: { trigger: item, start: 'top 92%' },
        });
      });

      // Social proof
      gsap.from('.social-heading', {
        opacity: 0, y: 20, duration: 0.5,
        scrollTrigger: { trigger: '.social-heading', start: 'top 88%' },
      });
      gsap.utils.toArray<HTMLElement>('.social-logo').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 20, duration: 0.4, delay: i * 0.12,
          scrollTrigger: { trigger: el, start: 'top 92%' },
        });
      });
      gsap.from('.social-testimonial', {
        opacity: 0, y: 30, duration: 0.7,
        scrollTrigger: { trigger: '.social-testimonial', start: 'top 85%' },
      });

      // Final CTA
      gsap.from('.final-cta', {
        opacity: 0, scale: 0.92, y: 30, duration: 0.8,
        scrollTrigger: { trigger: '.final-cta', start: 'top 80%' },
      });

      // Footer
      gsap.from('.landing-footer', {
        opacity: 0, y: 15, duration: 0.5,
        scrollTrigger: { trigger: '.landing-footer', start: 'top 95%' },
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // SEO: Set document title
  useEffect(() => {
    document.title = 'TBOS - Système de Gestion Industrielle Béton | ERP Cloud';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'TBOS Suite: plateforme ERP cloud pour centrales à béton. Gestion production, logistique, finance et qualité en temps réel. +50 modules, 99.9% uptime.');
    return () => { document.title = 'TBOS Suite'; };
  }, []);

  return (
    <div ref={containerRef} className="bg-background text-foreground">
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "TBOS Suite",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Plateforme ERP cloud pour centrales à béton. Production, logistique, finance et qualité.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "MAD" },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "50" }
      }) }} />
      {/* FLOATING CONTROLS */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <LanguageSwitcher variant="compact" />
        <ThemeToggle />
      </div>

      {/* HERO */}
      <section className="landing-hero relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
          <img src={heroPlantNight} alt="Centrale à béton industrielle TBOS" loading="eager" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <div className="landing-grid-bg" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">{l.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="text-gradient-gold">{l.headline1}</span>
            <br />
            <span className="text-foreground/90">{l.headline2}</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {l.subtitle}{' '}
            <span className="text-foreground font-semibold">{l.subtitleBold}</span>{' '}
            {l.subtitleEnd}
          </p>

          {/* CTA */}
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-base px-8 py-6 rounded-2xl shadow-[0_4px_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_50px_hsl(var(--primary)/0.45)] transition-all duration-300"
            >
              {l.accessPlatform}
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="text-base px-8 py-6 rounded-2xl border-primary/30 hover:bg-primary/10 transition-all duration-300"
            >
              {demoLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Chargement...</>
              ) : (
                <><Play className="h-5 w-5 mr-2" />Essayer la démo</>
              )}
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-primary/20 flex items-start justify-center p-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              style={{ animation: 'scroll-bob 2s ease-in-out infinite' }}
            />
          </div>
        </div>

        <style>{`
          @keyframes scroll-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(12px); }
          }
        `}</style>
      </section>

      {/* STATS BAR */}
      <section className="relative border-y border-border overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <img src={statsTexture} alt="" loading="lazy" className="w-full h-full object-cover opacity-20 dark:opacity-30" />
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card rounded-2xl p-6 sm:p-8 bg-card border border-border text-center transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm">
              <stat.icon className="h-6 w-6 text-primary/60 mx-auto mb-3" />
              <p
                className="stat-num text-3xl sm:text-4xl font-black text-gradient-gold"
                data-target={stat.num}
                data-decimals={stat.decimals || 0}
                data-prefix={stat.prefix || ''}
                data-suffix={stat.suffix || ''}
              >
                {stat.prefix || ''}{0}{stat.suffix || ''}
              </p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 sm:py-32 relative overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <img src={modulesBg} alt="" loading="lazy" className="w-full h-full object-cover opacity-10 dark:opacity-15" />
          <div className="absolute inset-0 bg-background/95 dark:bg-background/90" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="features-heading text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4">{l.featuresLabel}</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              {l.featuresTitle1}{' '}
              <span className="text-gradient-gold">{l.featuresTitle2}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">{l.featuresDesc}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="feature-card rounded-2xl p-8 bg-card border border-border group transition-all duration-300 hover:border-primary/25 hover:shadow-glow-sm">
                <div className="p-3 rounded-xl bg-primary/8 border border-primary/15 w-fit mb-5 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <PricingSection />

      {/* TRUST BAR */}
      <section className="border-t border-border py-16 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="trust-heading text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">{l.trustTitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {trusted.map((item) => (
              <div key={item} className="trust-item flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border">
                <CheckCircle2 className="h-4 w-4 text-primary/70" />
                <span className="text-sm font-medium text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <SocialProofSection />

      {/* GULF TRUST METRICS */}
      <GulfTrustBar />

      {/* BOOK DEMO */}
      <BookDemoSection />

      {/* FINAL CTA */}
      <section className="py-24 sm:py-32 text-center bg-background">
        <div className="max-w-3xl mx-auto px-6">
          <div className="final-cta">
            <Building2 className="h-12 w-12 text-primary/40 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              {l.readyTo}{' '}
              <span className="text-gradient-gold">{l.dominate}</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">{l.finalCtaDesc}</p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-base px-10 py-6 rounded-2xl shadow-[0_4px_30px_hsl(var(--primary)/0.3)]"
            >
              {l.getStarted}
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer border-t border-border py-8 bg-background">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary/50" />
            <span className="font-bold text-foreground/70">TBOS</span>
            <span>• {l.footerVersion}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            <span>{l.footerGlobal}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
