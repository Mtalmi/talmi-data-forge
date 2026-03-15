import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyableTextProps {
  text: string;
  displayText?: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  toastMessage?: string;
  children?: React.ReactNode;
}

export function CopyableText({
  text,
  displayText,
  className,
  style,
  iconSize = 12,
  toastMessage = 'Copié !',
  children,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(toastMessage, { duration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Impossible de copier');
    }
  }, [text, toastMessage]);

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>
      {children || displayText || text}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              opacity: copied ? 1 : 0.4,
              transition: 'opacity 150ms, color 150ms',
              color: copied ? '#22C55E' : 'currentColor',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
            onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.opacity = '0.4'; }}
          >
            {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
            {copied ? 'Copié !' : 'Copier'}
          </span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
