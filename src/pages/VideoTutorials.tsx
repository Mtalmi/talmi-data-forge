import MainLayout from '@/components/layout/MainLayout';
import { VideoTutorialsSection } from '@/components/video-tutorials';
import { Badge } from '@/components/ui/badge';
import { Video, GraduationCap } from 'lucide-react';

export default function VideoTutorials() {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Tutoriels Vidéo
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Formation
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Maîtrisez TBOS avec nos guides vidéo interactifs
              </p>
            </div>
          </div>
        </div>

        {/* Video Tutorials Section */}
        <VideoTutorialsSection />
      </div>
    </MainLayout>
  );
}
