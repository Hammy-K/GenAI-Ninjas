import confetti from "canvas-confetti";
import wowSound from "@/assets/wow.mp3";
import { isSoundEnabled } from "@/hooks/useSoundSetting";

export type CelebrationTier = "micro" | "small" | "medium" | "large";

// One shared, lazily-created audio element for the celebratory cue.
let wowAudio: HTMLAudioElement | null = null;

/**
 * Play the celebration sound, gated by the persisted sound setting (§5: sound is
 * opt-out and respected everywhere). Independent of reduced motion — sound is not
 * motion. Reserved for small+ tiers; a single step (micro) never earns a "wow".
 */
function playWow(): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  try {
    if (!wowAudio) {
      wowAudio = new Audio(wowSound);
      wowAudio.volume = 0.5;
    }
    wowAudio.currentTime = 0;
    void wowAudio.play().catch(() => {});
  } catch {
    // Audio unsupported or autoplay-blocked — celebration is still non-blocking.
  }
}

/** Check if motion is reduced in user preferences */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Play haptic feedback based on celebration tier */
function haptic(tier: CelebrationTier): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  const patterns: Record<CelebrationTier, number | number[]> = {
    micro: 10,
    small: [20, 10, 20],
    medium: [30, 10, 30, 10, 30],
    large: [50, 20, 50],
  };

  try {
    navigator.vibrate(patterns[tier]);
  } catch {
    // Vibration not supported or denied
  }
}

/**
 * Unified celebration API respecting prefers-reduced-motion
 *
 * @param tier Celebration intensity: micro (feedback), small (summary), medium (milestone), large (rare)
 */
export function celebrate(tier: CelebrationTier): void {
  const reduced = prefersReducedMotion();

  // Haptic always fires (can be user-disabled separately)
  haptic(tier);

  // Sound follows the same hierarchy (§5): the celebratory cue plays for a
  // completed lesson and above, never for a single micro step. Gated by setting.
  if (tier !== "micro") playWow();

  // Only fire confetti if motion is not reduced
  if (reduced) return;

  switch (tier) {
    case "micro":
      // No confetti for micro - just feedback via haptic
      break;

    case "small":
      // Light confetti burst, centered
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      break;

    case "medium":
      // Full-screen celebration with multiple bursts
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
      // Second burst from corners for drama
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { x: 0.1, y: 0 },
        });
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { x: 0.9, y: 0 },
        });
      }, 200);
      break;

    case "large":
      // Maximum celebration - cannon fire
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
      // Rainbow confetti burst
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() * 0.5 },
            colors: ["#a78bfa", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
          });
        }, i * 150);
      }
      break;
  }
}

export default celebrate;
