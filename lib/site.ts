export const SITE = {
  name: "HABU",
  tagline: "Deep Exploration Systems",
  description:
    "HABU builds the deep-ocean exosuit for extreme underwater exploration — engineered for pressure, predators, and the unknown.",
} as const;

/**
 * Primary navigation. Targets are section ids that mount in later phases;
 * scrollTo() no-ops gracefully until a target exists on the page.
 */
export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Technology", href: "#technology" },
  { label: "Mission", href: "#mission" },
  { label: "Specifications", href: "#specifications" },
  { label: "Contact", href: "#contact" },
] as const;

/** Where "Begin the Dive" lands: the first film chapter. */
export const DIVE_TARGET_ID = "section-2";

/** The brand mark uploaded by the client — helmet emblem on pure black. */
export const LOGO_SRC = "/assets/logo.jpg";

/**
 * Film chapters. Both are re-encoded ALL-INTRA (every frame a keyframe) so
 * the scroll-scrub seeks resolve instantly; the client's original inter-frame
 * uploads stalled between their sparse keyframes. See film.config.ts for the
 * ffmpeg recipe before swapping either asset.
 */
export const SECTION_TWO_SRC = "/assets/section-02.mp4";
export const SECTION_THREE_SRC = "/assets/section-03.mp4";
export const SECTION_FIVE_SRC = "/assets/section-05.mp4";
export const SECTION_SIX_SRC = "/assets/section-06.mp4";
export const SECTION_SEVEN_SRC = "/assets/section-07.mp4";
export const FOOTER_SRC = "/assets/footer.mp4";
