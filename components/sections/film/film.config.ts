import {
  FOOTER_SRC,
  SECTION_FIVE_SRC,
  SECTION_SEVEN_SRC,
  SECTION_SIX_SRC,
  SECTION_THREE_SRC,
  SECTION_TWO_SRC,
} from "@/lib/site";

/**
 * The film reel — every chapter after the hero, in story order, each backed
 * by one of the client's uploaded MP4s. Copy lives here so wording changes
 * never touch choreography.
 *
 * The experience currently ends at Section 2 (the story past it is being
 * redesigned). Section 3 and everything after it were removed along with
 * their assets; resume by appending entries below — the reel handles
 * ordering, z-stacking and the isLast ending with no other changes.
 *
 * Scrub-video note: chapter MP4s must be encoded ALL-INTRA (every frame a
 * keyframe) or `currentTime` seeking stalls between sparse keyframes and the
 * scrub visibly freezes. section-02.mp4 was re-encoded this way; do the same
 * for any new chapter (ffmpeg: -g 1 -keyint_min 1 -sc_threshold 0 -crf 16).
 */

export type ChapterContent = {
  label: string;
  headingLines: string[];
  description?: string;
  support?: string;
  indicatorLabel?: string;
  /** Which side the copy column sits on. Defaults to "left". */
  side?: "left" | "right";
};

export type FilmChapter = {
  id: string;
  src: string;
  ariaLabel: string;
  /** Scroll runway in viewport-heights (includes the 1vh being-covered tail). */
  length: number;
  /**
   * "film" (default): story chapter with optional copy overlay.
   * "product": the interactive product inspection (ProductSection) — video
   * intro, then a scroll-driven camera rig over the held final frame.
   * "footer": the final chapter (FooterSection) — mission-complete scene
   * with CTA, footer navigation, brand mark and ambient life.
   */
  kind?: "film" | "product" | "footer";
  content?: ChapterContent;
};

export const FILM_CHAPTERS: FilmChapter[] = [
  {
    // `length` is the scroll runway in viewport-heights; ~2.2vh of scrub
    // (non-last: 2vh covered tail) plays the whole 8s all-intra clip at a
    // deliberate, cinematic pace before Section 3 slides over it. Left-aligned
    // copy (the default).
    id: "section-2",
    src: SECTION_TWO_SRC,
    ariaLabel: "Mission 01 — the descent begins",
    length: 4.2,
    content: {
      label: "MISSION 01",
      headingLines: ["Every Great Discovery", "Begins Below the Surface."],
      description:
        "Engineered for explorers who refuse to stop where maps end. Every descent is a journey into the unknown.",
      support:
        "Designed for extreme underwater exploration with uncompromising protection, intelligent engineering, and complete environmental awareness.",
      indicatorLabel: "Keep Descending",
    },
  },
  {
    // Copy sits on the RIGHT for visual variety against Section 2's left
    // column. Slides over Section 2 as the next scene of the same film.
    id: "section-3",
    src: SECTION_THREE_SRC,
    ariaLabel: "Mission 02 — the deeper dark",
    length: 4.2,
    content: {
      label: "MISSION 02",
      headingLines: ["The Deeper You Go,", "The More the Ocean", "Keeps Hidden"],
      description:
        "Every meter below the surface reveals a world untouched by time. What once seemed empty now becomes a place filled with mystery, silence, and discovery.",
      support:
        "With visibility fading and pressure increasing, only precision, confidence, and reliable engineering allow the journey to continue.",
      indicatorLabel: "Descend Further",
      side: "right",
    },
  },
  {
    // The encounter — the shark strike at the ancient gate. Copy on the LEFT
    // (the default side), keeping the shark's half of the frame clean.
    id: "section-5",
    src: SECTION_FIVE_SRC,
    ariaLabel: "Mission 03 — the encounter",
    length: 4.2,
    content: {
      label: "MISSION 03",
      headingLines: ["Not Every Encounter", "Announces Itself"],
      description:
        "Out of the silence, the ocean’s oldest hunter arrives without warning. Every system, every seam, every layer of the suit now has one job — hold.",
      support:
        "Engineered to withstand what cannot be predicted. Tested against instincts older than maps, so the mission continues after the moment passes.",
      indicatorLabel: "Survive the Encounter",
    },
  },
  {
    // The passage — through the gate and out of the story, ending on the
    // suit's hero pose (the film's own transition into the product reveal).
    // Copy on the RIGHT; the diver holds the left half of the frame.
    id: "section-6",
    src: SECTION_SIX_SRC,
    ariaLabel: "Mission 04 — through the gate",
    length: 4.2,
    content: {
      label: "MISSION 04",
      headingLines: ["What Survives Down Here", "Is Built, Not Born"],
      description:
        "Past the gate, the mission changes. The question is no longer what lives in the deep — it is what kind of engineering deserves to stand beside it.",
      support:
        "Every plate, seal, and system that held through the encounter now steps into the light. This is where the suit becomes the story.",
      indicatorLabel: "Meet the Suit",
      side: "right",
    },
  },
  {
    // The product experience (isLast): SECTION 7's film introduces the suit
    // in hero pose, then scroll becomes a camera rig inspecting the held
    // final frame — helmet, arm, life-support, boots, overview. Stops and
    // spec-panel content live in product-section.tsx.
    id: "section-7",
    src: SECTION_SEVEN_SRC,
    ariaLabel: "The HABU exosuit — product inspection",
    length: 11,
    kind: "product",
  },
  {
    // The final chapter: the film carries its own mission-complete UI; the
    // component adds the closing copy, a breathing glow on the baked title,
    // and hotspots that make the rendered controls real.
    id: "contact",
    src: FOOTER_SRC,
    ariaLabel: "Mission complete — the end of the dive",
    length: 4.5,
    kind: "footer",
  },
];
