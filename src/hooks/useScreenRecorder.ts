import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasAudio: boolean;
  hasScreen: boolean;
}

interface UseScreenRecorderReturn {
  state: RecordingState;
  startRecording: (withAudio?: boolean) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  previewStream: MediaStream | null;
  error: string | null;
  uploadRecording: (blob: Blob, title: string) => Promise<string | null>;
}

export function useScreenRecorder(): UseScreenRecorderReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    hasAudio: false,
    hasScreen: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setPreviewStream(null);
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async (withAudio: boolean = true): Promise<boolean> => {
    try {
      setError(null);
      cleanup();

      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: withAudio // System audio from shared screen
      });

      let combinedStream = displayStream;
      let hasMicAudio = false;

      // Request microphone for voiceover
      if (withAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          // Combine video with microphone audio
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            combinedStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...displayStream.getAudioTracks(),
              audioTrack
            ]);
            hasMicAudio = true;
          }
        } catch (audioErr) {
          console.warn('Microphone access denied, continuing without voiceover:', audioErr);
          toast.warning('Micro non disponible - enregistrement sans voix');
        }
      }

      streamRef.current = combinedStream;
      setPreviewStream(combinedStream);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3000000 // 3 Mbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stream ending (user clicks "Stop sharing")
      displayStream.getVideoTracks()[0].onended = () => {
        if (state.isRecording) {
          stopRecording();
          toast.info('Partage d\'écran arrêté');
        }
      };

      // Start recording with 1 second chunks
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        hasAudio: hasMicAudio,
        hasScreen: true,
      });

      toast.success('🔴 Enregistrement démarré');
      return true;

    } catch (err) {
      console.error('Failed to start recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast.error('Permission refusée - veuillez autoriser le partage d\'écran');
      } else {
        toast.error('Impossible de démarrer l\'enregistrement');
      }
      
      cleanup();
      return false;
    }
  }, [cleanup, state.isRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanup();
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        cleanup();
        
        setState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          hasAudio: false,
          hasScreen: false,
        });
        
        toast.success(`✅ Enregistrement terminé (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setState(prev => ({ ...prev, isPaused: true }));
      toast.info('⏸️ Enregistrement en pause');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      
      // Resume timer
      const pausedDuration = state.duration;
      startTimeRef.current = Date.now() - (pausedDuration * 1000);
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);
      
      setState(prev => ({ ...prev, isPaused: false }));
      toast.info('▶️ Enregistrement repris');
    }
  }, [state.duration]);

  const uploadRecording = useCallback(async (blob: Blob, title: string): Promise<string | null> => {
    try {
      const fileName = `tutorials/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.webm`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('tutorial-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          cacheControl: '3600'
        });

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Le stockage des tutoriels n\'est pas configuré');
          console.error('Bucket tutorial-recordings does not exist');
          return null;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tutorial-recordings')
        .getPublicUrl(fileName);

      toast.success('📹 Vidéo uploadée avec succès');
      return publicUrl;

    } catch (err) {
      console.error('Failed to upload recording:', err);
      toast.error('Erreur lors de l\'upload de la vidéo');
      return null;
    }
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    previewStream,
    error,
    uploadRecording,
  };
}
