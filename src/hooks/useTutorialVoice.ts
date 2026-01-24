import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface VoiceState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  usingFallback: boolean;
}

// Browser-native TTS fallback
const speakWithBrowserTTS = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr')) || voices[0];
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

export function useTutorialVoice() {
  const [state, setState] = useState<VoiceState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    usingFallback: false,
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
    window.speechSynthesis?.cancel();

    setState({ isLoading: true, isPlaying: false, error: null, usingFallback: false });

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
        // Fall back to browser TTS on any error
        console.warn('ElevenLabs unavailable, using browser TTS fallback');
        setState({ isLoading: false, isPlaying: true, error: null, usingFallback: true });
        await speakWithBrowserTTS(text);
        setState(prev => ({ ...prev, isPlaying: false }));
        return;
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

      setState({ isLoading: false, isPlaying: true, error: null, usingFallback: false });
      await audio.play();

    } catch (error) {
      // Try browser TTS as last resort
      console.warn('Tutorial voice error, trying browser fallback:', error);
      try {
        setState({ isLoading: false, isPlaying: true, error: null, usingFallback: true });
        await speakWithBrowserTTS(text);
        setState(prev => ({ ...prev, isPlaying: false }));
      } catch (fallbackError) {
        const errorMessage = 'Synthèse vocale indisponible';
        console.error('Both TTS methods failed:', fallbackError);
        setState({ isLoading: false, isPlaying: false, error: errorMessage, usingFallback: false });
        toast.error(errorMessage);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setState(prev => ({ ...prev, isPlaying: false }));
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
