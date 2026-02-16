import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Tablet, Monitor, Share, PlusSquare, MoreVertical, CheckCircle2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      playSound('success');
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: '⚡', title: 'Accès instantané', desc: 'Lancement en 1 tap depuis l\'écran d\'accueil' },
    { icon: '📴', title: 'Mode hors-ligne', desc: 'Consultez vos données même sans connexion' },
    { icon: '🔔', title: 'Notifications push', desc: 'Alertes critiques en temps réel' },
    { icon: '🔒', title: 'Sécurisé', desc: 'Authentification et données chiffrées' },
  ];

  const iosSteps = [
    { icon: <Share className="h-5 w-5" />, text: 'Appuyez sur le bouton Partager', highlight: 'en bas de Safari' },
    { icon: <PlusSquare className="h-5 w-5" />, text: 'Sélectionnez "Sur l\'écran d\'accueil"', highlight: 'dans le menu' },
    { icon: <CheckCircle2 className="h-5 w-5" />, text: 'Confirmez en appuyant "Ajouter"', highlight: 'en haut à droite' },
  ];

  const androidSteps = [
    { icon: <MoreVertical className="h-5 w-5" />, text: 'Appuyez sur le menu (⋮)', highlight: 'en haut à droite de Chrome' },
    { icon: <Download className="h-5 w-5" />, text: 'Sélectionnez "Installer l\'application"', highlight: 'ou "Ajouter à l\'écran d\'accueil"' },
    { icon: <CheckCircle2 className="h-5 w-5" />, text: 'Confirmez l\'installation', highlight: 'TBOS apparaîtra sur votre écran' },
  ];

  if (isInstalled) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">TBOS est installé !</h1>
          <p className="text-muted-foreground">L'application est disponible depuis votre écran d'accueil.</p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Retour au tableau de bord
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-lg mx-auto px-6 pt-12 pb-8 text-center space-y-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 mb-6">
              <span className="text-3xl font-black text-primary-foreground tracking-tight">TB</span>
            </div>
            <h1 className="text-3xl font-bold">Installer TBOS</h1>
            <p className="text-muted-foreground mt-2">
              Talmi Beton Operating System — votre centrale dans la poche
            </p>
          </motion.div>

          {/* Direct install button (Chrome/Edge) */}
          {deferredPrompt && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Button size="lg" className="w-full text-base h-14 rounded-2xl shadow-lg shadow-primary/20" onClick={handleInstall}>
                <Download className="h-5 w-5 mr-2" />
                Installer maintenant
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-8 pb-12">
        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="border-border/50 h-full">
                <CardContent className="p-4 text-center space-y-2">
                  <span className="text-2xl">{f.icon}</span>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Platform-specific instructions */}
        {(platform === 'ios' || (!deferredPrompt && platform !== 'android')) && (
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Tablet className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Installation sur iPhone / iPad</h2>
                  <Badge variant="outline" className="text-[10px]">Safari</Badge>
                </div>
                <div className="space-y-4">
                  {iosSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.text}</p>
                        <p className="text-xs text-muted-foreground">{step.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(platform === 'android' && !deferredPrompt) && (
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Installation sur Android</h2>
                  <Badge variant="outline" className="text-[10px]">Chrome</Badge>
                </div>
                <div className="space-y-4">
                  {androidSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.text}</p>
                        <p className="text-xs text-muted-foreground">{step.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Device compatibility */}
        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          {[
            { icon: <Smartphone className="h-5 w-5" />, label: 'Mobile' },
            { icon: <Tablet className="h-5 w-5" />, label: 'Tablette' },
            { icon: <Monitor className="h-5 w-5" />, label: 'Desktop' },
          ].map(d => (
            <div key={d.label} className="flex flex-col items-center gap-1 text-xs">
              {d.icon}
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
