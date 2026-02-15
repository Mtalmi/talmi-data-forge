import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSoundEnabled, setSoundEnabled, playSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(getSoundEnabled);

  const toggle = () => {
    const next = !enabled;
    setSoundEnabled(next);
    setEnabled(next);
    if (next) playSound('tap');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn(
        "h-9 w-9 rounded-xl transition-all",
        enabled ? "text-foreground" : "text-muted-foreground"
      )}
      title={enabled ? 'Son activé' : 'Son désactivé'}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </Button>
  );
}
