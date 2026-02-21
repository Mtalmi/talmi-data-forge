import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle, ArrowRight, Zap, BarChart3, Lock, Globe, Eye } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
// Lazy-load heavy background image — not needed for LCP
const authIndustrial = new URL('@/assets/auth-industrial.jpg', import.meta.url).href;


const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const passwordStrengthSchema = z.string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[0-9]/, 'Au moins un chiffre requis')
  .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial requis (!@#$...)');

const signupSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: passwordStrengthSchema,
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Faible', color: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Moyen', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Bon', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Fort', color: 'bg-emerald-500' };
  return { score, label: 'Excellent', color: 'bg-emerald-400' };
}

// Animated counter component
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => requestAnimationFrame(animate), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">{label}</div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Mouse tracking for ambient glow
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Rate limit check before login
  const checkRateLimit = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rate-limit-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ email, action: 'login' }),
      });
      const data = await res.json();
      if (!data.allowed) {
        setError(data.message || 'Trop de tentatives. Veuillez réessayer plus tard.');
        return false;
      }
      return true;
    } catch {
      // If rate limit service is down, allow login (fail open)
      return true;
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!validation.success) { setError(validation.error.errors[0].message); setLoading(false); return; }
      
      // Check rate limit
      const allowed = await checkRateLimit(loginEmail);
      if (!allowed) { setLoading(false); return; }
      
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        setError(error.message.includes('Invalid login credentials') ? 'Email ou mot de passe incorrect' : error.message);
      }
    } catch { setError('Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const validation = signupSchema.safeParse({ email: signupEmail, password: signupPassword, confirmPassword: signupConfirmPassword, fullName: signupFullName });
      if (!validation.success) { setError(validation.error.errors[0].message); setLoading(false); return; }
      const { error } = await signUp(signupEmail, signupPassword, signupFullName);
      if (error) {
        setError(error.message.includes('already registered') ? 'Cet email est déjà utilisé' : error.message);
      } else {
        setSuccess('Compte créé! Vérifiez votre email pour confirmer.');
        setSignupEmail(''); setSignupPassword(''); setSignupConfirmPassword(''); setSignupFullName('');
      }
    } catch { setError('Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Floating Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full transition-all duration-3000"
          style={{
            width: 800,
            height: 800,
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, hsl(51 100% 50% / 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            right: '10%',
            bottom: '10%',
            background: 'radial-gradient(circle, hsl(350 100% 50% / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(51 100% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(51 100% 50% / 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Left Panel - Branding & Stats (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 xl:p-16">
        {/* Cinematic Industrial Background */}
        <div className="absolute inset-0 z-0">
          <img src={authIndustrial} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/60" />
        </div>
        {/* Logo & Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(45 100% 42%))',
              }}
            >
              <span className="text-xl font-black text-primary-foreground tracking-tight">TB</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">TBOS</h1>
              <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Enterprise Suite</p>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg">
          <h2
            className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] mb-6"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--muted-foreground)) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            La centrale à béton.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(51 100% 50%) 0%, hsl(45 100% 60%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Réinventée.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Contrôle total de vos opérations, finances et logistique en temps réel.
            Sécurité de niveau bancaire. Intelligence artificielle intégrée.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { icon: Zap, label: 'Temps Réel' },
              { icon: Shield, label: 'Sécurité Bancaire' },
              { icon: BarChart3, label: 'IA Intégrée' },
              { icon: Globe, label: 'Multi-Sites' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm text-sm text-muted-foreground"
              >
                <f.icon className="h-3.5 w-3.5 text-primary" />
                {f.label}
              </div>
            ))}
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-3 gap-8 p-6 rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm">
            <AnimatedStat value={99} suffix="%" label="Uptime SLA" />
            <AnimatedStat value={50} suffix="+" label="Modules" />
            <AnimatedStat value={24} suffix="/7" label="Monitoring" />
          </div>
        </div>

        {/* Bottom Trust Badges */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary/70" />
            Chiffrement AES-256
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary/70" />
            RLS Enterprise
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
            Cloud Souverain
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle border glow on left edge */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (shown only on small screens) */}
          <div className="lg:hidden text-center space-y-4">
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow"
                style={{
                  background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(45 100% 42%))',
                }}
              >
                <span className="text-2xl font-black text-primary-foreground tracking-tight">TB</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">TBOS</h1>
              <p className="text-sm text-muted-foreground">Talmi Beton Operating System</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Bienvenue</h2>
            <p className="text-muted-foreground text-sm mt-1">Connectez-vous pour accéder au système</p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 sm:p-8 shadow-glass">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Inscription
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4 border-success/50 text-success">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input id="login-email" type="email" placeholder="vous@exemple.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all" />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_30px_hsl(var(--primary)/0.5)] transition-all duration-300" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
                    ) : (
                      <>Se connecter<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom complet</Label>
                    <Input id="signup-name" type="text" placeholder="Votre nom" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input id="signup-email" type="email" placeholder="vous@exemple.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl" />
                  </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                       <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
                       <Input id="signup-password" type="password" placeholder="••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl" />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="signup-confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmer</Label>
                       <Input id="signup-confirm" type="password" placeholder="••••••" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required className="h-12 bg-input/50 border-border/50 rounded-xl" />
                     </div>
                   </div>
                   <PasswordStrengthMeter password={signupPassword} />
                  <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_6px_30px_hsl(var(--primary)/0.5)] transition-all duration-300" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</>
                    ) : (
                      <>Créer un compte<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>


          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/60">
            Système sécurisé • Talmi Beton © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}