import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Factory, Truck, FlaskConical, BarChart3,
  Zap, Lock, Globe, ArrowRight, CheckCircle2,
  Building2, Users, TrendingUp, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroPlantNight from '@/assets/hero_plant_night.jpg';
import statsTexture from '@/assets/stats-texture.jpg';
import modulesBg from '@/assets/modules-bg.jpg';

const stats = [
  { value: '50+', label: 'Modules', icon: Zap },
  { value: '99.9%', label: 'Uptime', icon: Shield },
  { value: '< 2s', label: 'Load Time', icon: TrendingUp },
  { value: 'AES-256', label: 'Encryption', icon: Lock },
];

const features = [
  {
    icon: Factory,
    title: 'Production Intelligence',
    desc: 'Real-time batch monitoring, AI quality control, and automated deviation alerts. Every cubic meter tracked from silo to site.',
  },
  {
    icon: Truck,
    title: 'Fleet Command Center',
    desc: 'Live GPS tracking, geofence alerts, fuel theft detection, and driver rotation optimization across your entire fleet.',
  },
  {
    icon: BarChart3,
    title: 'Financial Fortress',
    desc: 'Treasury management, AR/AP reconciliation, tax compliance calendar, and cash flow forecasting with forensic audit trails.',
  },
  {
    icon: FlaskConical,
    title: 'Laboratory & Quality',
    desc: 'Digital test certificates, humidity photo verification, slump tracking, and automated QC departure gates.',
  },
  {
    icon: Eye,
    title: 'CEO God Mode',
    desc: 'Executive command center with real-time profit tickers, anomaly detection, emergency overrides, and midnight transaction alerts.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    desc: '10+ distinct roles from CEO to driver. Every action logged, every modification traced, every decision accountable.',
  },
];

const trusted = [
  'ISO 9001 Compliant', 'GDPR Ready', 'SOC 2 Aligned', 'Multi-Tenant Architecture',
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-foreground">
      {/* HERO */}
      <section className="landing-hero relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroPlantNight} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <div className="landing-grid-bg" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
          >
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Enterprise Operating System</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            <span className="text-gradient-gold">The Operating System</span>
            <br />
            <span className="text-foreground/90">for Concrete Titans</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            TBOS unifies production, logistics, finance, quality, and fleet management
            into one{' '}
            <span className="text-foreground font-semibold">military-grade platform</span>{' '}
            built for ready-mix concrete operations.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-base px-8 py-6 rounded-2xl shadow-[0_4px_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_50px_hsl(var(--primary)/0.45)] transition-all duration-300"
            >
              Access Platform
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-base px-8 py-6 rounded-2xl"
            >
              Explore Modules
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/20 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
            />
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section className="relative border-y border-primary/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={statsTexture} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="landing-stat-card text-center"
            >
              <stat.icon className="h-6 w-6 text-primary/60 mx-auto mb-3" />
              <p className="text-3xl sm:text-4xl font-black text-gradient-gold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={modulesBg} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4">Modules</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Built for the{' '}
              <span className="text-gradient-gold">Real World</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Every module is battle-tested in live batching plant operations, not a lab.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="landing-feature-card group"
              >
                <div className="p-3 rounded-xl bg-primary/8 border border-primary/15 w-fit mb-5 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-t border-primary/10 py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">Enterprise Standards</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {trusted.map((item) => (
              <div key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary/70" />
                <span className="text-sm font-medium text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 sm:py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Building2 className="h-12 w-12 text-primary/40 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Ready to{' '}
              <span className="text-gradient-gold">Dominate</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Join the next generation of concrete operators running their empire from a single screen.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-base px-10 py-6 rounded-2xl shadow-[0_4px_30px_hsl(var(--primary)/0.3)]"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary/50" />
            <span className="font-bold text-foreground/70">TBOS</span>
            <span>• Enterprise Suite v2.0</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            <span>Built for global concrete operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
