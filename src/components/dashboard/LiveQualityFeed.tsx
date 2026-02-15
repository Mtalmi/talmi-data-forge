import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Camera, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Droplets, 
  Truck,
  MapPin,
  Clock,
  Eye,
  RefreshCw,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface QualityFeedItem {
  type: 'depart' | 'humidite';
  id: string;
  reference_id: string;
  valeur: number;
  conforme: boolean;
  photo_url: string;
  photo_timestamp: string;
  latitude: number | null;
  longitude: number | null;
  operateur: string;
  created_at: string;
  description: string;
  camion: string | null;
  client: string | null;
}

export function LiveQualityFeed() {
  const { isCeo, isSuperviseur } = useAuth();
  const { t, lang } = useI18n();
  const dateFnsLocale = getDateLocale(lang);
  const [items, setItems] = useState<QualityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<QualityFeedItem | null>(null);

  const fetchQualityFeed = async () => {
    try {
      setLoading(true);
      
      const [departuresRes, humidityRes] = await Promise.all([
        supabase
          .from('controles_depart')
          .select(`
            id,
            bl_id,
            affaissement_mm,
            affaissement_conforme,
            photo_slump_url,
            photo_slump_timestamp,
            photo_slump_latitude,
            photo_slump_longitude,
            valide_par_name,
            valide_at,
            bons_livraison_reels!inner(camion_assigne, client_id),
            clients:bons_livraison_reels!inner(clients!inner(nom_client))
          `)
          .order('valide_at', { ascending: false })
          .limit(20),
        supabase
          .from('controles_humidite')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const feedItems: QualityFeedItem[] = [];

      if (departuresRes.data) {
        departuresRes.data.forEach((d: any) => {
          feedItems.push({
            type: 'depart',
            id: d.id,
            reference_id: d.bl_id,
            valeur: d.affaissement_mm,
            conforme: d.affaissement_conforme,
            photo_url: d.photo_slump_url,
            photo_timestamp: d.photo_slump_timestamp,
            latitude: d.photo_slump_latitude,
            longitude: d.photo_slump_longitude,
            operateur: d.valide_par_name || t.widgets.qualityFeed.unknown,
            created_at: d.valide_at,
            description: t.widgets.qualityFeed.departureControl,
            camion: d.bons_livraison_reels?.camion_assigne,
            client: d.clients?.clients?.nom_client || null
          });
        });
      }

      if (humidityRes.data) {
        humidityRes.data.forEach((h: any) => {
          feedItems.push({
            type: 'humidite',
            id: h.id,
            reference_id: h.id,
            valeur: h.taux_humidite_pct,
            conforme: h.taux_humidite_pct <= 8,
            photo_url: h.photo_url,
            photo_timestamp: h.photo_timestamp,
            latitude: h.photo_latitude,
            longitude: h.photo_longitude,
            operateur: h.verified_by_name || t.widgets.qualityFeed.unknown,
            created_at: h.created_at,
            description: `${t.widgets.qualityFeed.humidityControl} - ${h.materiau}`,
            camion: null,
            client: null
          });
        });
      }

      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setItems(feedItems.slice(0, 30));
    } catch (error) {
      console.error('Error fetching quality feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCeo || isSuperviseur) {
      fetchQualityFeed();
      
      const interval = setInterval(fetchQualityFeed, 30000);
      return () => clearInterval(interval);
    }
  }, [isCeo, isSuperviseur]);

  if (!isCeo && !isSuperviseur) return null;

  return (
    <Card className="card-industrial">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t.widgets.qualityFeed.title}
            </CardTitle>
            <CardDescription>
              {t.widgets.qualityFeed.subtitle}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchQualityFeed} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t.widgets.qualityFeed.noRecentChecks}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
                    item.conforme ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                  )}
                  onClick={() => setSelectedPhoto(item)}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.photo_url}
                      alt="QC Photo"
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div className={cn(
                      "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
                      item.conforme ? "bg-success" : "bg-destructive"
                    )}>
                      {item.conforme ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <XCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.type === 'depart' ? (
                        <Badge variant="outline" className="text-xs">
                          <Truck className="h-3 w-3 mr-1" />
                          {t.widgets.qualityFeed.departure}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Droplets className="h-3 w-3 mr-1" />
                          {t.widgets.qualityFeed.humidity}
                        </Badge>
                      )}
                      <span className={cn(
                        "font-mono font-bold",
                        item.conforme ? "text-success" : "text-destructive"
                      )}>
                        {item.type === 'depart' ? `${item.valeur}mm` : `${item.valeur}%`}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.created_at), 'HH:mm', { locale: dateFnsLocale })}
                      </span>
                      {item.latitude && (
                        <span className="flex items-center gap-1 text-success">
                          <MapPin className="h-3 w-3" />
                          GPS
                        </span>
                      )}
                      {item.camion && (
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {item.camion}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs mt-1">
                      {t.widgets.qualityFeed.by}: <span className="font-medium">{item.operateur}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Photo Detail Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedPhoto?.description}
              </DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="space-y-4">
                <img
                  src={selectedPhoto.photo_url}
                  alt="QC Photo"
                  className="w-full h-auto rounded-lg"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.widgets.qualityFeed.value}</p>
                    <p className={cn(
                      "text-2xl font-mono font-bold",
                      selectedPhoto.conforme ? "text-success" : "text-destructive"
                    )}>
                      {selectedPhoto.type === 'depart' 
                        ? `${selectedPhoto.valeur}mm` 
                        : `${selectedPhoto.valeur}%`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.widgets.qualityFeed.status}</p>
                    <Badge className={selectedPhoto.conforme ? "bg-success" : "bg-destructive"}>
                      {selectedPhoto.conforme ? t.widgets.qualityFeed.compliant : t.widgets.qualityFeed.nonCompliant}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.widgets.qualityFeed.dateTime}</p>
                    <p className="font-medium">
                      {format(new Date(selectedPhoto.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: dateFnsLocale })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.widgets.qualityFeed.operator}</p>
                    <p className="font-medium">{selectedPhoto.operateur}</p>
                  </div>
                  {selectedPhoto.latitude && selectedPhoto.longitude && (
                    <div className="space-y-2 col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {t.widgets.qualityFeed.geolocation}
                      </p>
                      <p className="font-mono text-sm">
                        {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
