import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeOnboardingModal } from '@/components/onboarding/WelcomeOnboardingModal';

const SPLASH_SHOWN_KEY = 'tbos_splash_shown';

export default function Index() {
  const { user, loading } = useAuth();

  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    setShowSplash(false);
  };

  // Show loading spinner while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // SYNCHRONOUS redirect — no useEffect delay, no flash of dashboard
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Dashboard />
      <WelcomeOnboardingModal />
    </>
  );
}