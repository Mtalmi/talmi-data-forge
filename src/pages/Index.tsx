import { useState } from 'react';
import Dashboard from './Dashboard';
import { SplashScreen } from '@/components/layout/SplashScreen';

// Session storage key to show splash only once per session
const SPLASH_SHOWN_KEY = 'tbos_splash_shown';

// TODO: RE-ENABLE AUTH AFTER TESTING - remove this bypass
export default function Index() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Dashboard />
    </>
  );
}
