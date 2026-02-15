import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';

const SPLASH_SHOWN_KEY = 'tbos_splash_shown';

export default function Index() {
  const { user, loading } = useAuth();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  useEffect(() => {
    if (!loading && !user && !isDemoMode) {
      navigate('/landing', { replace: true });
    }
  }, [user, loading, navigate, isDemoMode]);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    setShowSplash(false);
  };

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user && !isDemoMode) return null;

  return (
    <>
      {showSplash && !isDemoMode && <SplashScreen onComplete={handleSplashComplete} />}
      <Dashboard />
    </>
  );
}
