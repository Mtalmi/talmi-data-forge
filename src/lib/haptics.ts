/**
 * Haptic feedback utility for mobile devices
 * Provides subtle vibration feedback for key interactions
 */

type HapticPattern = 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  success: [10, 50, 10],
  error: [50, 30, 50, 30, 50],
  warning: [30, 50, 30],
  light: 10,
  medium: 25,
  heavy: 50,
};

/**
 * Trigger haptic feedback on mobile devices
 * Falls back gracefully on unsupported devices
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  // Check if vibration API is supported
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    // Silently fail on unsupported devices
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Haptic feedback for successful actions
 */
export function hapticSuccess(): void {
  triggerHaptic('success');
}

/**
 * Haptic feedback for errors/blocks
 */
export function hapticError(): void {
  triggerHaptic('error');
}

/**
 * Haptic feedback for warnings
 */
export function hapticWarning(): void {
  triggerHaptic('warning');
}

/**
 * Light tap feedback
 */
export function hapticTap(): void {
  triggerHaptic('light');
}
