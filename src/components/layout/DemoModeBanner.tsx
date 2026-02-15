import { useDemoMode } from '@/hooks/useDemoMode';
import { Eye, X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DemoModeBanner() {
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const handleExit = () => {
    exitDemoMode();
    navigate('/auth');
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground">
      <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold">
        <Eye className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Mode Démonstration — Données fictives • Lecture seule</span>
        <span className="sm:hidden">Mode Démo • Lecture seule</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="ml-2 h-7 gap-1.5 text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs font-bold"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Se connecter</span>
          <X className="h-3.5 w-3.5 sm:hidden" />
        </Button>
      </div>
    </div>
  );
}
