import { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    // Find the scrollable content container
    const el = document.querySelector('[data-main-scroll]');
    if (el) {
      setVisible(el.scrollTop > 500);
    }
  }, []);

  useEffect(() => {
    const el = document.querySelector('[data-main-scroll]');
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    const el = document.querySelector('[data-main-scroll]');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed z-40 flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{
        bottom: 80,
        right: 24,
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(212, 168, 67, 0.15)',
        border: '1px solid rgba(212, 168, 67, 0.2)',
        color: '#D4A843',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.25)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 168, 67, 0.15)'; }}
      title="Retour en haut"
    >
      <ChevronUp size={16} strokeWidth={2} />
    </button>
  );
}
