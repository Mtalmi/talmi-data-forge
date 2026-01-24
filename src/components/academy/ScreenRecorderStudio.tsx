import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Upload, 
  Download,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  RotateCcw,
  Camera,
  Volume2,
  Settings,
  Trash2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';
import { useTutorialVoice } from '@/hooks/useTutorialVoice';

interface ScreenRecorderStudioProps {
  open: boolean;
  onClose: () => void;
  onSave?: (videoUrl: string, metadata: TutorialMetadata) => void;
}

interface TutorialMetadata {
  title: string;
  description: string;
  category: 'basics' | 'operations' | 'advanced';
  duration: number;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function ScreenRecorderStudio({ open, onClose, onSave }: ScreenRecorderStudioProps) {
  const [phase, setPhase] = useState<'setup' | 'recording' | 'preview' | 'saving'>('setup');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [withAudio, setWithAudio] = useState(true);
  const [metadata, setMetadata] = useState<TutorialMetadata>({
    title: '',
    description: '',
    category: 'basics',
    duration: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const livePreviewRef = useRef<HTMLVideoElement>(null);
  
  const { 
    state, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording,
    previewStream,
    error,
    uploadRecording 
  } = useScreenRecorder();

  const { speak, stop: stopVoice, isPlaying: isVoicePlaying } = useTutorialVoice();

  // Update live preview with screen stream
  useEffect(() => {
    if (livePreviewRef.current && previewStream) {
      livePreviewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setPhase('setup');
      setRecordedBlob(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
      setMetadata({ title: '', description: '', category: 'basics', duration: 0 });
    }
  }, [open, recordedUrl]);

  const handleStartRecording = async () => {
    // Start countdown
    setCountdown(3);
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);

    const success = await startRecording(withAudio);
    if (success) {
      setPhase('recording');
      
      // AI voice introduction
      if (withAudio) {
        await speak("Enregistrement démarré. Vous pouvez maintenant démontrer les étapes du tutoriel.");
      }
    }
  };

  const handleStopRecording = async () => {
    if (withAudio) {
      await speak("Parfait, enregistrement terminé.");
      stopVoice();
    }
    
    const blob = await stopRecording();
    if (blob) {
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setMetadata(prev => ({ ...prev, duration: state.duration }));
      setPhase('preview');
    }
  };

  const handleRetake = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setPhase('setup');
  };

  const handleSave = async () => {
    if (!recordedBlob || !metadata.title) return;
    
    setIsSaving(true);
    setPhase('saving');
    
    try {
      const publicUrl = await uploadRecording(recordedBlob, metadata.title);
      if (publicUrl && onSave) {
        onSave(publicUrl, metadata);
      }
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title || 'tutorial'}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gradient-to-br from-background via-background to-destructive/5">
        <DialogHeader className="p-4 bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent border-b relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--destructive)/0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <motion.div 
              className={cn(
                "p-3 rounded-xl border",
                state.isRecording 
                  ? "bg-destructive/30 border-destructive/50" 
                  : "bg-primary/20 border-primary/30"
              )}
              animate={state.isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {state.isRecording ? (
                <div className="relative">
                  <Video className="h-6 w-6 text-destructive" />
                  <motion.div 
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </div>
              ) : (
                <Camera className="h-6 w-6 text-primary" />
              )}
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                Studio d'Enregistrement
                <Badge className="bg-gradient-to-r from-destructive/20 to-primary/20 text-destructive border-destructive/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Screen Recording
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Créez des tutoriels vidéo authentiques avec votre voix
              </DialogDescription>
            </div>
            
            {state.isRecording && (
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="animate-pulse text-lg px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-destructive-foreground mr-2 animate-pulse" />
                  REC {formatDuration(state.duration)}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Countdown Overlay */}
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="text-9xl font-bold text-primary"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}

            {/* Setup Phase */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Settings Card */}
                <Card className="border-2 border-dashed border-primary/30">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center border border-primary/30">
                        <Monitor className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">Prêt à enregistrer</h3>
                        <p className="text-sm text-muted-foreground">
                          Partagez votre écran et enregistrez votre voix pour créer un tutoriel professionnel
                        </p>
                      </div>
                    </div>

                    {/* Audio Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        {withAudio ? (
                          <Mic className="h-5 w-5 text-success" />
                        ) : (
                          <MicOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <Label htmlFor="audio-toggle" className="font-medium">
                            Enregistrer avec le micro
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Ajoutez votre voix pour expliquer les étapes
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="audio-toggle"
                        checked={withAudio}
                        onCheckedChange={setWithAudio}
                      />
                    </div>

                    {/* Tips */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Settings className="h-4 w-4" />
                        Conseils pour un bon tutoriel
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Fermez les onglets et applications inutiles</li>
                        <li>• Parlez clairement et pas trop vite</li>
                        <li>• Décrivez chaque action avant de la faire</li>
                        <li>• Utilisez un environnement calme pour le son</li>
                      </ul>
                    </div>

                    {error && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Start Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleStartRecording}
                    size="lg"
                    className="gap-3 bg-gradient-to-r from-destructive to-primary hover:from-destructive/90 hover:to-primary/90 text-lg px-8 py-6 shadow-lg"
                  >
                    <Video className="h-6 w-6" />
                    Démarrer l'Enregistrement
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Recording Phase */}
            {phase === 'recording' && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Live Preview */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-4 border-destructive/50 shadow-2xl">
                  <video
                    ref={livePreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Recording indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 backdrop-blur">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-destructive"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="text-white font-mono font-bold">
                      {formatDuration(state.duration)}
                    </span>
                  </div>

                  {/* Audio indicator */}
                  {state.hasAudio && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/80 backdrop-blur">
                      <Volume2 className="h-4 w-4 text-success-foreground" />
                      <span className="text-success-foreground text-sm">Micro ON</span>
                    </div>
                  )}

                  {/* Paused overlay */}
                  {state.isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <Pause className="h-16 w-16 text-warning mx-auto mb-2" />
                        <p className="text-white text-lg font-medium">En pause</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {state.isPaused ? (
                    <Button
                      onClick={resumeRecording}
                      size="lg"
                      variant="outline"
                      className="gap-2"
                    >
                      <Play className="h-5 w-5" />
                      Reprendre
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseRecording}
                      size="lg"
                      variant="outline"
                      className="gap-2"
                    >
                      <Pause className="h-5 w-5" />
                      Pause
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleStopRecording}
                    size="lg"
                    variant="destructive"
                    className="gap-2 px-8"
                  >
                    <Square className="h-5 w-5" />
                    Arrêter l'enregistrement
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Preview Phase */}
            {phase === 'preview' && recordedUrl && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Video Preview */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-success/50 shadow-xl">
                  <video
                    ref={videoPreviewRef}
                    src={recordedUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <Badge className="absolute top-4 left-4 bg-success/90">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enregistrement terminé
                  </Badge>
                </div>

                {/* Metadata Form */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre du tutoriel *</Label>
                      <Input
                        id="title"
                        value={metadata.title}
                        onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Comment créer un Bon de Commande"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={metadata.description}
                        onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez ce que couvre ce tutoriel..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <div className="flex gap-2">
                        {(['basics', 'operations', 'advanced'] as const).map((cat) => (
                          <Button
                            key={cat}
                            variant={metadata.category === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMetadata(prev => ({ ...prev, category: cat }))}
                          >
                            {cat === 'basics' ? 'Fondamentaux' : cat === 'operations' ? 'Opérations' : 'Avancé'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(metadata.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video className="h-4 w-4" />
                        <span>{recordedBlob ? `${(recordedBlob.size / 1024 / 1024).toFixed(1)} MB` : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRetake} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Refaire
                    </Button>
                    <Button variant="outline" onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleSave} 
                    disabled={!metadata.title || isSaving}
                    className="gap-2 bg-gradient-to-r from-success to-primary"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Upload className="h-4 w-4" />
                        </motion.div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Sauvegarder le Tutoriel
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Saving Phase */}
            {phase === 'saving' && (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="p-6 rounded-full bg-primary/20 border border-primary/30"
                >
                  <Upload className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold">Upload en cours...</h3>
                <p className="text-muted-foreground">Votre tutoriel est en cours de sauvegarde</p>
                <Progress value={66} className="w-64" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
