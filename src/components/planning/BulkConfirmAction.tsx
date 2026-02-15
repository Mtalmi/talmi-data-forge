import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Loader2, ClipboardCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

interface BonLivraison {
  bl_id: string;
  client_id: string;
  clients?: { nom_client: string } | null;
  volume_m3: number;
}

interface BulkConfirmActionProps {
  pendingBLs: BonLivraison[];
  onConfirmAll: (blIds: string[]) => Promise<void>;
  loading?: boolean;
}

export function BulkConfirmAction({
  pendingBLs,
  onConfirmAll,
  loading = false,
}: BulkConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { t } = useI18n();
  const bc = t.bulkConfirm;

  const handleConfirmAll = async () => {
    if (pendingBLs.length === 0) return;
    
    setIsConfirming(true);
    try {
      const blIds = pendingBLs.map(bl => bl.bl_id);
      await onConfirmAll(blIds);
      toast.success(bc.success.replace('{count}', String(pendingBLs.length)));
    } catch (error) {
      console.error('Error confirming all:', error);
      toast.error(bc.error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (pendingBLs.length === 0) {
    return null;
  }

  const totalVolume = pendingBLs.reduce((sum, bl) => sum + bl.volume_m3, 0);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2 bg-success hover:bg-success/90"
          disabled={loading || isConfirming}
        >
          {isConfirming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {bc.confirmAll} ({pendingBLs.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-success" />
            {bc.confirmAllTitle}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {bc.confirmDescription
                  .replace('{count}', String(pendingBLs.length))
                  .replace('{volume}', String(totalVolume))}
              </p>
              
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {pendingBLs.map(bl => (
                  <div key={bl.bl_id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                    <div>
                      <span className="font-mono">{bl.bl_id}</span>
                      <span className="text-muted-foreground ml-2">
                        - {bl.clients?.nom_client || bl.client_id}
                      </span>
                    </div>
                    <Badge variant="outline">{bl.volume_m3} m³</Badge>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {bc.confirmAction}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{bc.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmAll}
            className="bg-success hover:bg-success/90 gap-2"
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {bc.confirm.replace('{count}', String(pendingBLs.length))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}