import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Loader2 } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DuplicateDevisButtonProps {
  devis: Devis;
  onDuplicated?: () => void;
  compact?: boolean;
}

export function DuplicateDevisButton({ devis, onDuplicated, compact = false }: DuplicateDevisButtonProps) {
  const { user } = useAuth();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const generateDevisId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}${month}-${random}`;
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    
    try {
      const newDevisId = generateDevisId();
      const date_expiration = new Date();
      date_expiration.setDate(date_expiration.getDate() + 30);

      const { error } = await supabase
        .from('devis')
        .insert({
          devis_id: newDevisId,
          client_id: devis.client_id,
          formule_id: devis.formule_id,
          volume_m3: devis.volume_m3,
          distance_km: devis.distance_km,
          cut_per_m3: devis.cut_per_m3,
          fixed_cost_per_m3: devis.fixed_cost_per_m3,
          transport_extra_per_m3: devis.transport_extra_per_m3,
          total_cost_per_m3: devis.total_cost_per_m3,
          margin_pct: devis.margin_pct,
          prix_vente_m3: devis.prix_vente_m3,
          total_ht: devis.total_ht,
          statut: 'en_attente',
          validite_jours: devis.validite_jours,
          date_expiration: date_expiration.toISOString().split('T')[0],
          notes: devis.notes ? `(Copie de ${devis.devis_id}) ${devis.notes}` : `Copie de ${devis.devis_id}`,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success(`Devis ${newDevisId} créé (copie de ${devis.devis_id})`);
      onDuplicated?.();
    } catch (error) {
      console.error('Error duplicating devis:', error);
      toast.error('Erreur lors de la duplication du devis');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="h-8 w-8 p-0"
          >
            {isDuplicating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Dupliquer ce devis</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDuplicate}
      disabled={isDuplicating}
      className="gap-1"
    >
      {isDuplicating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      Dupliquer
    </Button>
  );
}
