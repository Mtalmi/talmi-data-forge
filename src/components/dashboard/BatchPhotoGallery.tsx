import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ZoomIn,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';

interface BatchPhoto {
  id: string;
  bl_id: string;
  batch_number: number;
  quality_status: 'pending' | 'ok' | 'warning' | 'critical';
  photo_pupitre_url: string;
  entered_by_name: string | null;
  entered_at: string;
  variance_ciment_pct: number | null;
  variance_eau_pct: number | null;
  variance_sable_pct: number | null;
  variance_gravette_pct: number | null;
  variance_adjuvant_pct: number | null;
  ciment_reel_kg: number;
  eau_reel_l: number;
  notes: string | null;
}

const statusConfig = {
  ok: { 
    icon: CheckCircle, 
    color: 'text-success', 
    bg: 'bg-success/10',
    border: 'border-success/30',
    label: 'Conforme' 
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-warning', 
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    label: 'Écart' 
  },
  critical: { 
    icon: XCircle, 
    color: 'text-destructive', 
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    label: 'Critique' 
  },
  pending: { 
    icon: Camera, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted/30',
    border: 'border-border',
    label: 'En attente' 
  },
};

export function BatchPhotoGallery() {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<BatchPhoto | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, ok: 0, warning: 0, critical: 0 });

  const fetchPhotos = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('production_batches')
        .select('id, bl_id, batch_number, quality_status, photo_pupitre_url, entered_by_name, entered_at, variance_ciment_pct, variance_eau_pct, variance_sable_pct, variance_gravette_pct, variance_adjuvant_pct, ciment_reel_kg, eau_reel_l, notes')
        .gte('entered_at', today.toISOString())
        .order('entered_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as BatchPhoto[];
      setPhotos(typedData);

      // Calculate stats
      setStats({
        total: typedData.length,
        ok: typedData.filter(p => p.quality_status === 'ok').length,
        warning: typedData.filter(p => p.quality_status === 'warning').length,
        critical: typedData.filter(p => p.quality_status === 'critical').length,
      });
    } catch (error) {
      console.error('Error fetching batch photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();

    // Realtime subscription
    const channel = supabase
      .channel('batch_photos_gallery')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_batches',
        },
        () => fetchPhotos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  };

  const openLightbox = (photo: BatchPhoto) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + photos.length) % photos.length
      : (currentIndex + 1) % photos.length;
    setSelectedPhoto(photos[newIndex]);
  };

  const getVarianceSummary = (photo: BatchPhoto) => {
    const variances: string[] = [];
    if (photo.variance_ciment_pct && photo.variance_ciment_pct > 2) {
      variances.push(`Ciment: +${photo.variance_ciment_pct.toFixed(1)}%`);
    }
    if (photo.variance_eau_pct && photo.variance_eau_pct > 2) {
      variances.push(`Eau: +${photo.variance_eau_pct.toFixed(1)}%`);
    }
    if (photo.variance_sable_pct && photo.variance_sable_pct > 2) {
      variances.push(`Sable: +${photo.variance_sable_pct.toFixed(1)}%`);
    }
    if (photo.variance_gravette_pct && photo.variance_gravette_pct > 2) {
      variances.push(`Gravette: +${photo.variance_gravette_pct.toFixed(1)}%`);
    }
    if (photo.variance_adjuvant_pct && photo.variance_adjuvant_pct > 2) {
      variances.push(`Adjuvant: +${photo.variance_adjuvant_pct.toFixed(1)}%`);
    }
    return variances;
  };

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Photos Pupitre</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Galerie du jour • {stats.total} photos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle className="h-3 w-3" />
                  {stats.ok}
                </span>
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.warning}
                </span>
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-3 w-3" />
                  {stats.critical}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucune photo aujourd'hui</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les photos apparaîtront ici lors de la saisie des batches
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo) => {
                  const status = statusConfig[photo.quality_status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <button
                      key={photo.id}
                      onClick={() => openLightbox(photo)}
                      className={cn(
                        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary',
                        status.border
                      )}
                    >
                      <img
                        src={photo.photo_pupitre_url}
                        alt={`Pupitre ${photo.bl_id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Status overlay */}
                      <div className={cn(
                        'absolute top-1 right-1 p-1 rounded',
                        status.bg
                      )}>
                        <StatusIcon className={cn('h-3 w-3', status.color)} />
                      </div>
                      
                      {/* BL ID overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                        <span className="text-[10px] font-mono text-white truncate block">
                          {photo.bl_id}
                        </span>
                      </div>
                      
                      {/* Zoom indicator on hover */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedPhoto && (
            <>
              <DialogHeader className="p-4 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-primary" />
                    <span className="font-mono">{selectedPhoto.bl_id}</span>
                    <Badge variant="outline">Batch #{selectedPhoto.batch_number}</Badge>
                    {(() => {
                      const status = statusConfig[selectedPhoto.quality_status];
                      return (
                        <Badge className={cn('text-xs', status.bg, status.color, 'border-0')}>
                          {status.label}
                        </Badge>
                      );
                    })()}
                  </DialogTitle>
                  <a
                    href={selectedPhoto.photo_pupitre_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </DialogHeader>

              <div className="relative">
                {/* Navigation buttons */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white"
                      onClick={() => navigatePhoto('prev')}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white"
                      onClick={() => navigatePhoto('next')}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Main image */}
                <img
                  src={selectedPhoto.photo_pupitre_url}
                  alt={`Pupitre ${selectedPhoto.bl_id}`}
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              </div>

              {/* Photo details */}
              <div className="p-4 pt-3 border-t space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Heure:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(selectedPhoto.entered_at), 'HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Opérateur:</span>
                    <span className="ml-2 font-medium">
                      {selectedPhoto.entered_by_name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ciment:</span>
                    <span className="ml-2 font-mono font-medium">
                      {selectedPhoto.ciment_reel_kg.toFixed(0)} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Eau:</span>
                    <span className="ml-2 font-mono font-medium">
                      {selectedPhoto.eau_reel_l.toFixed(0)} L
                    </span>
                  </div>
                </div>

                {/* Variance badges */}
                {(() => {
                  const variances = getVarianceSummary(selectedPhoto);
                  if (variances.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {variances.map((v, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className={cn(
                            'font-mono text-xs',
                            selectedPhoto.quality_status === 'critical' 
                              ? 'border-destructive text-destructive' 
                              : 'border-warning text-warning'
                          )}
                        >
                          {v}
                        </Badge>
                      ))}
                    </div>
                  );
                })()}

                {/* Notes */}
                {selectedPhoto.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-foreground">{selectedPhoto.notes}</p>
                  </div>
                )}

                {/* Photo index indicator */}
                {photos.length > 1 && (
                  <div className="text-center text-xs text-muted-foreground">
                    {photos.findIndex(p => p.id === selectedPhoto.id) + 1} / {photos.length}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
