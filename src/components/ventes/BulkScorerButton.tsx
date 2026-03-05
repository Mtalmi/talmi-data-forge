import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Devis } from '@/hooks/useSalesWorkflow';

interface BulkScorerButtonProps {
  devisList: Devis[];
  onDone: () => void;
}

export function BulkScorerButton({ devisList, onDone }: BulkScorerButtonProps) {
  const [scoring, setScoring] = useState(false);

  const unscoredCount = devisList.filter(d => d.score_ia == null).length;

  const handleBulkScore = async () => {
    const unscored = devisList.filter(d => d.score_ia == null);
    if (unscored.length === 0) {
      toast.info('Tous les devis sont déjà scorés');
      return;
    }

    setScoring(true);
    let successCount = 0;

    for (const devis of unscored) {
      try {
        console.log('[BulkScorer] Scoring:', devis.devis_id);
        await fetch('https://talmi.app.n8n.cloud/webhook/deal-scorer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ devis_id: devis.devis_id }),
        });
        successCount++;
      } catch (err) {
        console.error('[BulkScorer] Error for', devis.devis_id, err);
      }
    }

    setScoring(false);
    toast.success(`${successCount} devis scorés avec succès`);
    onDone();
  };

  if (unscoredCount === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBulkScore}
      disabled={scoring}
      className="gap-1.5"
    >
      {scoring ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Target className="h-3.5 w-3.5" />
      )}
      {scoring ? 'Scoring en cours...' : `🎯 Scorer (${unscoredCount})`}
    </Button>
  );
}
