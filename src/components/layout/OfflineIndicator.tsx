import { useState, useEffect, useRef } from 'react';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const lastOfflineRef = useRef<Date | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const goOffline = () => {
      lastOfflineRef.current = new Date();
      setOnline(false);
      setShowReconnected(false);
    };
    const goOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    if (online) return;
    const iv = setInterval(() => {
      if (lastOfflineRef.current) {
        setMinutesAgo(Math.floor((Date.now() - lastOfflineRef.current.getTime()) / 60000));
      }
    }, 10000);
    return () => clearInterval(iv);
  }, [online]);

  if (online && !showReconnected) return null;

  const MONO = 'ui-monospace, SFMono-Regular, monospace';

  if (!online) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000,
        fontFamily: MONO, fontSize: 11, textAlign: 'center',
        background: 'rgba(239,68,68,0.1)',
        borderBottom: '1px solid rgba(239,68,68,0.2)',
        color: '#EF4444', padding: 8,
      }}>
        ⚠ CONNEXION PERDUE — Les données affichées peuvent ne pas être à jour. Dernière synchronisation: il y a {minutesAgo < 1 ? '< 1' : minutesAgo} minute{minutesAgo !== 1 ? 's' : ''}.
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000,
      fontFamily: MONO, fontSize: 11, textAlign: 'center',
      background: 'rgba(34,197,94,0.1)',
      borderBottom: '1px solid rgba(34,197,94,0.2)',
      color: '#22C55E', padding: 8,
      animation: 'fadeIn 200ms ease-out',
    }}>
      ✓ RECONNECTÉ — Synchronisation en cours...
    </div>
  );
}
