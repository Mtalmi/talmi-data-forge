/**
 * Ambient Sound Design System
 * Subtle audio feedback for key UI interactions
 * Uses Web Audio API for lightweight, instant playback
 */

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Check user preference
function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const pref = localStorage.getItem('tbos-sound-enabled');
  return pref === null ? true : pref === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem('tbos-sound-enabled', String(enabled));
}

export function getSoundEnabled(): boolean {
  return isSoundEnabled();
}

type SoundType = 'tap' | 'success' | 'error' | 'notification' | 'navigate' | 'open' | 'close';

const SOUND_CONFIG: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number; ramp?: number; freq2?: number }> = {
  tap:          { freq: 800,  duration: 0.04, type: 'sine',     gain: 0.08 },
  success:      { freq: 520,  duration: 0.15, type: 'sine',     gain: 0.10, freq2: 780 },
  error:        { freq: 200,  duration: 0.20, type: 'square',   gain: 0.06, freq2: 150 },
  notification: { freq: 880,  duration: 0.12, type: 'sine',     gain: 0.09, freq2: 1100 },
  navigate:     { freq: 600,  duration: 0.06, type: 'sine',     gain: 0.06 },
  open:         { freq: 400,  duration: 0.10, type: 'sine',     gain: 0.07, freq2: 600 },
  close:        { freq: 500,  duration: 0.08, type: 'sine',     gain: 0.06, freq2: 350 },
};

export function playSound(sound: SoundType): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    const config = SOUND_CONFIG[sound];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freq, now);

    if (config.freq2) {
      osc.frequency.linearRampToValueAtTime(config.freq2, now + config.duration * 0.6);
    }

    gainNode.gain.setValueAtTime(config.gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + config.duration);
  } catch {
    // Silently fail — audio not critical
  }
}

// Convenience exports
export const soundTap = () => playSound('tap');
export const soundSuccess = () => playSound('success');
export const soundError = () => playSound('error');
export const soundNotification = () => playSound('notification');
export const soundNavigate = () => playSound('navigate');
export const soundOpen = () => playSound('open');
export const soundClose = () => playSound('close');
