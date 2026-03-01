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
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-all duration-150"
      style={{ background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; e.currentTarget.style.color = '#F59E0B'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
      title={enabled ? 'Son activé' : 'Son désactivé'}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
