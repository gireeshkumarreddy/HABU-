"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "@/components/sections/hero/particle-field";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import { LOGO_SRC, SITE } from "@/lib/site";

/**
 * The opening ritual: pure black hold → the helmet emblem materialises
 * (scale up, blue bloom, underwater particles, a slow float) → it recedes →
 * black hold → crossfade into the hero, which is already breathing
 * underneath. The logo asset is the emblem on true black, so its edges
 * dissolve invisibly into the screen.
 *
 * Scroll is locked while it plays; any key or tap fast-forwards (3.5×)
 * rather than jump-cutting. Skipped entirely under prefers-reduced-motion.
 * markIntroDone() fires as the crossfade STARTS so the hero entrance runs
 * beneath it — a crossfade, never a cut.
 */
export function IntroSequence() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [done, setDone] = useState(false);
  const { reducedMotion, markIntroDone, stopScroll, startScroll } = useExperience();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (reducedMotion || !root) {
        markIntroDone();
        setDone(true);
        return;
      }
      const q = gsap.utils.selector(root);
      const logo = q('[data-intro="logo"]');
      const glow = q('[data-intro="glow"]');
      const particles = q('[data-intro="particles"]');

      stopScroll();
      gsap.set(logo, { autoAlpha: 0, scale: 0.82, filter: "blur(10px)" });
      gsap.set([glow, particles], { autoAlpha: 0 });

      const tl = gsap.timeline({
        delay: 0.6, // the black hold — nothing, on purpose
        onComplete: () => setDone(true),
      });

      tl.to(logo, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power2.out" })
        .to(glow, { autoAlpha: 0.85, scale: 1.08, duration: 0.9, ease: EASE.ambient }, "-=0.55")
        .to(particles, { autoAlpha: 0.75, duration: 0.8, ease: EASE.ambient }, "<")
        // the float — one slow breath, like neutral buoyancy
        .to(logo, { y: -8, duration: 0.85, yoyo: true, repeat: 1, ease: EASE.ambient }, "-=0.25")
        .to(glow, { autoAlpha: 0, duration: 0.7, ease: EASE.ambient }, "-=0.6")
        .to(logo, { autoAlpha: 0, scale: 0.9, filter: "blur(6px)", duration: 0.8, ease: "power2.inOut" }, "-=0.3")
        .to(particles, { autoAlpha: 0, duration: 0.5, ease: EASE.ambient }, "<")
        .to({}, { duration: 0.5 }) // hold the black before the reveal
        .add(() => {
          // Hero entrance starts now, underneath the lifting veil.
          startScroll();
          markIntroDone();
        })
        .to(root, { autoAlpha: 0, duration: 0.9, ease: EASE.inOut });

      const skip = () => {
        if (tl.isActive()) tl.timeScale(3.5);
      };
      window.addEventListener("pointerdown", skip);
      window.addEventListener("keydown", skip);

      return () => {
        window.removeEventListener("pointerdown", skip);
        window.removeEventListener("keydown", skip);
        startScroll();
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  // Safety: never leave the experience gated if the timeline is interrupted.
  useEffect(() => {
    if (done) markIntroDone();
  }, [done, markIntroDone]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      data-intro="root"
      role="presentation"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black"
    >
      <noscript>
        <style>{`[data-intro="root"]{display:none}`}</style>
      </noscript>
      <div
        data-intro="particles"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <ParticleField className="h-full w-full" />
      </div>
      <div
        data-intro="glow"
        aria-hidden="true"
        className="pointer-events-none absolute size-[min(72vw,440px)] rounded-full bg-[radial-gradient(circle,rgba(79,195,255,0.38),transparent_65%)] blur-2xl"
      />
      {/* Screen blend on the WRAPPER (not the img): GSAP animates filter on
          this element, which isolates any blending set on descendants — the
          wrapper's own blend still composites against the page, dissolving
          the JPG's black plate so only the lit emblem exists. */}
      <div data-intro="logo" className="relative mix-blend-screen">
        <Image
          src={LOGO_SRC}
          alt={`${SITE.name} — ${SITE.tagline}`}
          width={480}
          height={320}
          priority
          className="h-auto w-[min(58vw,360px)]"
        />
      </div>
    </div>
  );
}
