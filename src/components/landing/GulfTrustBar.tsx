import { Shield, Globe, Building2, Clock, Zap, Lock } from 'lucide-react';

const metrics = [
  { icon: Building2, value: '50+', label: 'Plants Managed' },
  { icon: Globe, value: '6', label: 'Countries' },
  { icon: Clock, value: '99.99%', label: 'SLA Uptime' },
  { icon: Zap, value: '<200ms', label: 'API Response' },
  { icon: Lock, value: 'AES-256', label: 'Encryption' },
  { icon: Shield, value: '0', label: 'Data Breaches' },
];

export default function GulfTrustBar() {
  return (
    <section className="relative border-y border-border overflow-hidden">
      {/* Subtle gold top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="text-center group"
            >
              <m.icon className="h-5 w-5 text-primary/40 mx-auto mb-2 group-hover:text-primary/70 transition-colors" />
              <p className="text-xl sm:text-2xl font-black text-gradient-gold">{m.value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle gold bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
}
