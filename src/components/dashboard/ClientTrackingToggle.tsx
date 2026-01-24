import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Copy, ExternalLink, Loader2, Link2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientTrackingToggleProps {
  bcId: string;
  trackingToken: string | null;
  trackingEnabled: boolean;
  onToggle?: (enabled: boolean) => void;
  compact?: boolean;
}

export function ClientTrackingToggle({
  bcId,
  trackingToken,
  trackingEnabled,
  onToggle,
  compact = false,
}: ClientTrackingToggleProps) {
  const [enabled, setEnabled] = useState(trackingEnabled);
  const [loading, setLoading] = useState(false);

  const trackingUrl = trackingToken 
    ? `${window.location.origin}/track/${trackingToken}`
    : null;

  const handleToggle = async (newValue: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bons_commande')
        .update({ tracking_enabled: newValue })
        .eq('bc_id', bcId);

      if (error) throw error;

      setEnabled(newValue);
      onToggle?.(newValue);
      toast.success(newValue ? 'Suivi client activé' : 'Suivi client désactivé');
    } catch (err) {
      console.error('Error toggling tracking:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success('Lien copié dans le presse-papier');
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const openTrackingLink = () => {
    if (trackingUrl) {
      window.open(trackingUrl, '_blank');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="data-[state=checked]:bg-amber-500"
        />
        {enabled && trackingUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={copyTrackingLink}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      enabled 
        ? "bg-amber-500/5 border-amber-500/30" 
        : "bg-muted/20 border-border"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Eye className="h-4 w-4 text-amber-500" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            Suivi Client
          </span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>

      {enabled && trackingUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg border border-border">
            <Link2 className="h-4 w-4 text-amber-500/60 flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
              {trackingUrl}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={copyTrackingLink}
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Copier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={openTrackingLink}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Ouvrir
            </Button>
          </div>
        </div>
      )}

      {!enabled && (
        <p className="text-xs text-muted-foreground">
          Activez pour générer un lien de suivi partageable avec le client
        </p>
      )}
    </div>
  );
}
