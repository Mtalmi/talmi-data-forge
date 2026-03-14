import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getSoundEnabled, setSoundEnabled, playSound } from '@/lib/sounds';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(getSoundEnabled);

  const toggle = () => {
    const next = !enabled;
    setSoundEnabled(next);
    setEnabled(next);
    if (next) playSound('tap');
  };

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center cursor-pointer transition-colors duration-200"
      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#9CA3AF', border: 'none' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      title={enabled ? 'Son activé' : 'Son désactivé'}
    >
      {enabled ? <Volume2 size={16} strokeWidth={1.5} /> : <VolumeX size={16} strokeWidth={1.5} />}
    </button>
  );
}
