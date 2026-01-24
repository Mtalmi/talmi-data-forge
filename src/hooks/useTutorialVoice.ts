import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface VoiceState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

export function useTutorialVoice() {
  const [state, setState] = useState<VoiceState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setState({ isLoading: true, isPlaying: false, error: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Limite de requêtes atteinte. Réessayez plus tard.');
        }
        if (response.status === 402) {
          throw new Error('Crédits ElevenLabs épuisés.');
        }
        throw new Error(`Erreur vocale: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true }));
      };

      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };

      audio.onerror = () => {
        setState(prev => ({ ...prev, isPlaying: false, error: 'Erreur de lecture audio' }));
      };

      setState({ isLoading: false, isPlaying: true, error: null });
      await audio.play();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Tutorial voice error:', error);
      setState({ isLoading: false, isPlaying: false, error: errorMessage });
      toast.error(errorMessage);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const cleanup = useCallback(() => {
    stop();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
  }, [stop]);

  return {
    ...state,
    speak,
    stop,
    cleanup,
  };
}
