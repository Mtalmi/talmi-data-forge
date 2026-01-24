import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  FileText,
  User,
  Shield,
  Banknote,
  Lock
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

export function SplitViewHandshake() {
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

    const channel = supabase
      .channel('split_handshake_ui')
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

  // Separate items by stage
  const qualityPending = pendingItems.filter(item => !item.qualite_approuvee_at);
  const finalizePending = pendingItems.filter(item => item.qualite_approuvee_at && !item.admin_approuve_at);

  const renderItemCard = (item: PendingHandshake, stage: 'quality' | 'finalize') => {
    const isQuality = stage === 'quality';
    
    return (
      <div
        key={item.id}
        className={cn(
          "p-3 rounded-xl border-l-4 bg-card mb-2 transition-all",
          "hover:shadow-md cursor-pointer active:scale-[0.99]",
          isQuality ? "border-l-amber-500 bg-amber-500/5" : "border-l-blue-500 bg-blue-500/5"
        )}
        onClick={() => {
          setSelectedItem(item);
          setActionType(
            isQuality && canApproveQuality ? 'quality' :
            !isQuality && canFinalize ? 'finalize' : 'view'
          );
          setPreviewUrl(item.photo_materiel_url);
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <p className="font-bold text-xs truncate">{item.materiau}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{item.numero_bl || 'Sans BL'}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "shrink-0 text-[9px] px-1.5",
              isQuality ? "border-amber-500 text-amber-500" : "border-blue-500 text-blue-500"
            )}
          >
            {item.quantite}T
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {formatDistanceToNow(new Date(item.created_at), { locale: fr, addSuffix: true })}
          
          {item.photo_materiel_url ? (
            <span className="flex items-center gap-0.5 text-emerald-500">
              <ImageIcon className="h-2.5 w-2.5" />✓
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-destructive">
              <Camera className="h-2.5 w-2.5" />!
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
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[1, 2].map((col) => (
            <div key={col}>
              <Skeleton className="h-4 w-24 mb-3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border mb-2 animate-pulse">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
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
                Centre Handshake
              </CardTitle>
              <CardDescription className="text-xs">
                Double validation: Qualité → Administratif
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
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
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-medium text-sm">Aucune réception en attente</p>
              <p className="text-xs text-muted-foreground">Tout est finalisé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: Quality (Resp. Tech) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <Shield className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-amber-600 dark:text-amber-400">
                      Validation Qualité
                    </p>
                    <p className="text-[10px] text-muted-foreground">Resp. Technique</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] border-amber-500 text-amber-500">
                    {qualityPending.length}
                  </Badge>
                </div>
                
                <ScrollArea className="h-[220px] pr-2">
                  {qualityPending.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      Aucune en attente
                    </div>
                  ) : (
                    qualityPending.map(item => renderItemCard(item, 'quality'))
                  )}
                </ScrollArea>
              </div>

              {/* Vertical Separator */}
              <Separator orientation="vertical" className="hidden md:block absolute left-1/2 h-[260px]" />

              {/* RIGHT: Finalize (Agent Admin) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-md bg-blue-500/10">
                    <Banknote className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                      Finalisation Stock
                    </p>
                    <p className="text-[10px] text-muted-foreground">Agent Admin</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] border-blue-500 text-blue-500">
                    {finalizePending.length}
                  </Badge>
                </div>
                
                <ScrollArea className="h-[220px] pr-2">
                  {finalizePending.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      En attente de qualité
                    </div>
                  ) : (
                    finalizePending.map(item => renderItemCard(item, 'finalize'))
                  )}
                </ScrollArea>
              </div>
            </div>
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
                          <span className="text-sm text-muted-foreground">Photo obligatoire</span>
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
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Qualité validée le {format(new Date(selectedItem.qualite_approuvee_at), 'dd/MM HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {/* Action-specific UI */}
              {actionType === 'quality' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Notes sur la qualité (optionnel)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedItem(null)} disabled={processing}>
              Fermer
            </Button>
            
            {actionType === 'quality' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleQualityApproval(false)}
                  disabled={processing}
                  className="gap-1"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Rejeter
                </Button>
                <Button 
                  onClick={() => handleQualityApproval(true)}
                  disabled={processing || !selectedItem?.photo_materiel_url}
                  className="gap-1"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approuver Qualité
                </Button>
              </>
            )}
            
            {actionType === 'finalize' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button 
                        onClick={handleFinalize}
                        disabled={
                          processing || 
                          !selectedItem?.qualite_approuvee_at || 
                          !selectedItem?.photo_materiel_url ||
                          selectedItem?.statut !== 'qualité_validée'
                        }
                        className={cn(
                          "gap-1",
                          (!selectedItem?.qualite_approuvee_at || !selectedItem?.photo_materiel_url || selectedItem?.statut !== 'qualité_validée') && 
                          "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (!selectedItem?.qualite_approuvee_at || !selectedItem?.photo_materiel_url) ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Finaliser Stock
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {(!selectedItem?.qualite_approuvee_at || !selectedItem?.photo_materiel_url || selectedItem?.statut !== 'qualité_validée') && (
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-warning" />
                        <span>En attente de validation qualité par Abdel Sadek</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
