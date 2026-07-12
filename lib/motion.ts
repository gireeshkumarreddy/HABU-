/**
 * Shared motion language for the HABU experience.
 * Every phase (Hero, Descent, Ancient Structure, Shark Sequence, Product
 * Reveal, Mission Complete) should compose from these tokens so the whole
 * dive reads as one continuous piece of choreography.
 */

export const EASE = {
  /** Entrances — decelerating, cinematic. */
  out: "power3.out",
  /** Ambient loops — breathing light, drifting rays. */
  ambient: "sine.inOut",
  /** Veils and cross-fades. */
  inOut: "power2.inOut",
} as const;

export const ENTRANCE = {
  /** Seconds each element takes to arrive. */
  duration: 0.8,
  /** Seconds between successive elements. */
  stagger: 0.15,
  /** Global hold before the sequence starts, letting the preload veil lift. */
  delay: 0.45,
  /** Vertical travel in px. */
  y: 28,
  /** Starting blur in px. */
  blur: 12,
} as const;

/**
 * How much scroll the hero holds the frame for. The film reel's first
 * chapter slides in over the second half of this range (its wrapper pulls
 * up one viewport), so the hero is always covered before it ever releases —
 * the visitor never sees a pin let go.
 */
export const HERO_SCRUB_END = "+=190%";

/** Masked-line reveals — shared by the hero and chapter headings. */
export const REVEAL = {
  yPercent: 118,
  blur: 7,
  duration: 0.95,
  stagger: 0.1,
} as const;
