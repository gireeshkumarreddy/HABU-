"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useExperience } from "@/components/providers/experience-provider";
import { EASE } from "@/lib/motion";
import { SITE } from "@/lib/site";

/**
 * Solid abyss frame shown while the hero video buffers, so the experience
 * never renders half-loaded. Lifts with a slow fade once `ready`, timed so
 * the entrance choreography is already breathing underneath it.
 */
export function PreloadVeil({ ready }: { ready: boolean }) {
  const veilRef = useRef<HTMLDivElement | null>(null);
  const [gone, setGone] = useState(false);
  const { reducedMotion } = useExperience();

  useEffect(() => {
    if (!ready || gone) return;
    const veil = veilRef.current;
    if (reducedMotion || !veil) {
      setGone(true);
      return;
    }
    const tween = gsap.to(veil, {
      autoAlpha: 0,
      duration: 0.7,
      delay: 0.15,
      ease: EASE.inOut,
      onComplete: () => setGone(true),
    });
    return () => {
      tween.kill();
    };
  }, [ready, gone, reducedMotion]);

  if (gone) return null;

  return (
    <div
      ref={veilRef}
      role="status"
      aria-label="Preparing the dive"
      className="absolute inset-0 z-70 flex flex-col items-center justify-center gap-7 bg-abyss"
    >
      <div className="flex flex-col items-center gap-2">
        <span className="font-heading -mr-[0.5em] text-lg font-bold tracking-[0.5em] text-white">
          {SITE.name}
        </span>
        <span className="-mr-[0.3em] text-[9px] font-medium uppercase tracking-[0.3em] text-mist/70">
          {SITE.tagline}
        </span>
      </div>
      <span className="relative block h-px w-44 overflow-hidden bg-white/10">
        <span className="animate-veil-scan absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </span>
    </div>
  );
}
