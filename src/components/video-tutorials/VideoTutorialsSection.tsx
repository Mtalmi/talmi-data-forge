import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VideoTutorialCard, VideoTutorial } from './VideoTutorialCard';
import { VideoPlayer } from './VideoPlayer';
import { 
  Video, 
  FileText, 
  Truck, 
  MapPin,
  BookOpen,
  Zap,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Video tutorials data
const VIDEOS: VideoTutorial[] = [
  {
    id: 'devis_bc',
    title: 'Créer un Devis → BC',
    description: 'Workflow complet: devis, validation, conversion en bon de commande',
    category: 'Opérations',
    duration: 300,
    durationDisplay: '5:00',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/DIPZYBaZWnJRVgek.mp4',
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
  {
    id: 'valider_livraison',
    title: 'Valider une Livraison',
    description: 'Signature client, contrôle qualité, enregistrement paiement et facturation',
    category: 'Fondamentaux',
    duration: 240,
    durationDisplay: '4:00',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/FBJNgiKsqAFsrsnQ.mp4',
    icon: <Truck className="h-8 w-8 text-primary" />,
  },
  {
    id: 'fleet_predator',
    title: 'Fleet Predator GPS Avancé',
    description: 'Suivi tactique, détection de fraude carburant, alertes géofencing',
    category: 'Avancé',
    duration: 180,
    durationDisplay: '3:00',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/mhzFkSnSzfwlwuAF.mp4',
    icon: <MapPin className="h-8 w-8 text-primary" />,
  },
];

interface VideoTutorialsSectionProps {
  className?: string;
  compact?: boolean;
}

export function VideoTutorialsSection({ className, compact = false }: VideoTutorialsSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Tous');

  const filteredVideos = activeTab === 'Tous' 
    ? VIDEOS 
    : VIDEOS.filter(v => v.category === activeTab);

  const categories = ['Tous', 'Fondamentaux', 'Opérations', 'Avancé'];

  return (
    <>
      <Card className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden",
        className
      )}>
        <CardHeader className={compact ? "pb-3" : ""}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30",
                compact ? "h-10 w-10" : "h-14 w-14"
              )}>
                <Video className={cn("text-primary", compact ? "h-5 w-5" : "h-7 w-7")} />
              </div>
              <div>
                <CardTitle className={cn("flex items-center gap-2", compact && "text-base")}>
                  Tutoriels Vidéo
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {VIDEOS.length} vidéos
                  </Badge>
                </CardTitle>
                {!compact && (
                  <CardDescription>
                    Formations interactives pour maîtriser TBOS
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={compact ? "pt-0" : ""}>
          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Video Cards Grid */}
          <div className={cn(
            "grid gap-4",
            compact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {filteredVideos.map((video) => (
              <VideoTutorialCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredVideos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune vidéo dans cette catégorie</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <VideoPlayer
        videoUrl={selectedVideo?.videoUrl || ''}
        title={selectedVideo?.title || ''}
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      />
    </>
  );
}

// Export videos data for use elsewhere
export { VIDEOS };
export type { VideoTutorial };
