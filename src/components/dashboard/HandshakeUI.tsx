import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  CheckCircle, 
  XCircle,
  Handshake,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Package,
  Clock,
  ImageIcon,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { compressImage } from '@/lib/imageCompression';

interface PendingHandshake {
  id: string;
  materiau: string;
  quantite: number;
  fournisseur: string | null;
  numero_bl: string | null;
  photo_materiel_url: string | null;
  photo_bl_url: string | null;
  humidite_pct: number | null;
  qualite_visuelle: string | null;
  notes_qualite: string | null;
  qualite_approuvee_par: string | null;
  qualite_approuvee_at: string | null;
  admin_approuve_par: string | null;
  admin_approuve_at: string | null;
  statut: string | null;
  created_at: string;
}

type HandshakeStep = 'quality' | 'finalize';

export function HandshakeUI() {
  const { user, isResponsableTechnique, isAgentAdministratif, isCeo, isSuperviseur } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingHandshake[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingHandshake | null>(null);
  const [actionType, setActionType] = useState<'quality' | 'finalize' | 'view'>('view');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Determine user's role for the handshake
  const canApproveQuality = isResponsableTechnique || isSuperviseur || isCeo;
  const canFinalize = isAgentAdministratif || isSuperviseur || isCeo;

  const fetchPendingItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stock_receptions_pending')
        .select('*')
        .neq('statut', 'finalisé')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPendingItems((data || []) as unknown as PendingHandshake[]);
    } catch (error) {
      console.error('Error fetching pending handshakes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems();

    // Realtime subscription
    const channel = supabase
      .channel('handshake_ui')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_receptions_pending' },
        () => fetchPendingItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingItems();
    setRefreshing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'materiel' | 'bl') => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
      
      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(compressedFile);

      const fileName = `reception-${photoType}-${selectedItem.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('reception-photos')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('reception-photos')
        .getPublicUrl(data.path);

      // Update the record
      const updateField = photoType === 'materiel' ? 'photo_materiel_url' : 'photo_bl_url';
      await supabase
        .from('stock_receptions_pending')
        .update({ [updateField]: urlData.publicUrl })
        .eq('id', selectedItem.id);

      toast.success('Photo téléchargée');
      fetchPendingItems();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleQualityApproval = async (approved: boolean) => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('stock_receptions_pending')
        .update({
          qualite_approuvee_par: user?.id,
          qualite_approuvee_at: new Date().toISOString(),
          notes_qualite: notes || null,
          qualite_visuelle: approved ? 'conforme' : 'non_conforme',
          statut: approved ? 'qualité_validée' : 'rejeté',
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success(approved ? 'Qualité approuvée ✓' : 'Qualité rejetée');
      setSelectedItem(null);
      setNotes('');
      fetchPendingItems();
    } catch (error) {
      console.error('Quality approval error:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('stock_receptions_pending')
        .update({
          admin_approuve_par: user?.id,
          admin_approuve_at: new Date().toISOString(),
          statut: 'finalisé',
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_superviseur').insert({
        user_id: user?.id,
        user_name: profile?.full_name,
        action: 'STOCK_FINALIZED',
        table_name: 'stock_receptions_pending',
        record_id: selectedItem.id,
        changes: { materiau: selectedItem.materiau, quantite: selectedItem.quantite },
      });

      toast.success('Réception finalisée et ajoutée au stock');
      setSelectedItem(null);
      fetchPendingItems();
    } catch (error) {
      console.error('Finalization error:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const getStepStatus = (item: PendingHandshake): HandshakeStep => {
    if (!item.qualite_approuvee_at) return 'quality';
    return 'finalize';
  };

  const renderItemCard = (item: PendingHandshake) => {
    const step = getStepStatus(item);
    const needsQuality = step === 'quality';
    const needsFinalize = step === 'finalize';

    return (
      <div
        key={item.id}
        className={cn(
          "p-3 sm:p-4 rounded-xl border-l-4 bg-card mb-3 transition-all",
          "hover:shadow-md cursor-pointer active:scale-[0.99]",
          needsQuality && "border-l-amber-500 bg-amber-500/5",
          needsFinalize && "border-l-blue-500 bg-blue-500/5"
        )}
        onClick={() => {
          setSelectedItem(item);
          setActionType(
            needsQuality && canApproveQuality ? 'quality' :
            needsFinalize && canFinalize ? 'finalize' : 'view'
          );
          setPreviewUrl(item.photo_materiel_url);
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{item.materiau}</p>
            <p className="text-xs text-muted-foreground font-mono">{item.numero_bl || 'Sans BL'}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "shrink-0 text-[10px] px-2",
              needsQuality && "border-amber-500 text-amber-500",
              needsFinalize && "border-blue-500 text-blue-500"
            )}
          >
            {needsQuality ? 'QUALITÉ' : 'FINALISATION'}
          </Badge>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {item.quantite} T
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(item.created_at), { locale: fr, addSuffix: true })}
          </span>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap gap-1.5">
          {/* Photo status */}
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            item.photo_materiel_url 
              ? "bg-green-500/10 text-green-600 dark:text-green-400" 
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            {item.photo_materiel_url ? <ImageIcon className="h-2.5 w-2.5" /> : <Camera className="h-2.5 w-2.5" />}
            {item.photo_materiel_url ? 'Photo ✓' : 'Photo requise'}
          </span>

          {/* BL photo status */}
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            item.photo_bl_url 
              ? "bg-green-500/10 text-green-600 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          )}>
            <FileText className="h-2.5 w-2.5" />
            {item.photo_bl_url ? 'BL ✓' : 'BL optionnel'}
          </span>

          {/* Quality status */}
          {item.qualite_approuvee_at && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-2.5 w-2.5" />
              Qualité OK
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border mb-3 animate-pulse">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Handshake className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Réceptions en Attente
              </CardTitle>
              <CardDescription className="text-xs">
                Double validation: Qualité → Administratif
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {pendingItems.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="font-medium text-sm">Aucune réception en attente</p>
              <p className="text-xs text-muted-foreground">Tout est finalisé</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] sm:h-[400px] pr-2">
              {pendingItems.map(renderItemCard)}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              {actionType === 'quality' ? 'Validation Qualité' : 
               actionType === 'finalize' ? 'Finalisation Stock' : 'Détails Réception'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.numero_bl || 'Sans BL'} - {selectedItem?.materiau}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Photo Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo du matériel</label>
                {previewUrl || selectedItem.photo_materiel_url ? (
                  <div className="relative">
                    <img 
                      src={previewUrl || selectedItem.photo_materiel_url || ''} 
                      alt="Réception" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {actionType === 'quality' && (
                      <div className="absolute bottom-2 right-2">
                        <label className="cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, 'materiel')}
                            disabled={uploading}
                          />
                          <Button variant="secondary" size="sm" disabled={uploading}>
                            {uploading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Camera className="h-3 w-3" />
                            )}
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      onChange={(e) => handlePhotoUpload(e, 'materiel')}
                      disabled={uploading}
                    />
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Prendre ou télécharger photo</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantité</span>
                  <p className="font-medium">{selectedItem.quantite} T</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fournisseur</span>
                  <p className="font-medium">{selectedItem.fournisseur || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Humidité</span>
                  <p className="font-medium">{selectedItem.humidite_pct ? `${selectedItem.humidite_pct}%` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reçu le</span>
                  <p className="font-medium">
                    {format(new Date(selectedItem.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>

              {/* Approval Trail */}
              {selectedItem.qualite_approuvee_at && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Qualité validée
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {format(new Date(selectedItem.qualite_approuvee_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              )}

              {/* Notes (for quality action) */}
              {actionType === 'quality' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes qualité (optionnel)</label>
                  <Textarea
                    placeholder="Observations sur la qualité..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {/* Warning if no photo */}
              {!selectedItem.photo_materiel_url && actionType === 'quality' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Photo obligatoire avant approbation qualité
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {actionType === 'quality' && canApproveQuality && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleQualityApproval(false)}
                  disabled={processing}
                  className="min-h-[44px]"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Rejeter
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleQualityApproval(true)}
                  disabled={processing || !selectedItem?.photo_materiel_url}
                  className="min-h-[44px]"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approuver Qualité
                </Button>
              </>
            )}

            {actionType === 'finalize' && canFinalize && (
              <Button
                variant="default"
                onClick={handleFinalize}
                disabled={processing}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Finaliser et Ajouter au Stock
              </Button>
            )}

            {actionType === 'view' && (
              <Button variant="outline" onClick={() => setSelectedItem(null)} className="min-h-[44px]">
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
