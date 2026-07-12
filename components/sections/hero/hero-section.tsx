"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, ENTRANCE, HERO_SCRUB_END, REVEAL } from "@/lib/motion";
import { DIVE_TARGET_ID, SECTION_TWO_SRC } from "@/lib/site";
import { HeroVideo } from "./hero-video";
import { ParticleField } from "./particle-field";
import { PreloadVeil } from "./preload-veil";
import { ScrollIndicator } from "./scroll-indicator";
import { MissionModal } from "./mission-modal";

/**
 * The surface — chapter zero of the film. Layered as: video → light
 * shafts/fog → particles → SECTION-2 bridge → content. At rest the film
 * loops ambiently; scrolling grabs the playhead and scrubs it (reverse
 * rewinds), and the pin's tail crossfades onto SECTION 2's opening frame so
 * the next chapter begins on identical pixels. Mouse parallax moves text,
 * particles and light — never the film.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /**
   * Loop→scrub handoff state. `base` is the film time captured the moment
   * the visitor starts scrolling (null = ambient looping at the surface);
   * `target` is where scroll says the playhead should be.
   */
  const scrubStateRef = useRef<{ base: number | null; target: number }>({
    base: null,
    target: 0,
  });
  const [missionOpen, setMissionOpen] = useState(false);
  const { ready, introDone, markReady, reducedMotion, scrollTo } = useExperience();

  // Ambient light + the pinned scroll hand-off. Created once on mount inside
  // gsap.matchMedia so reduced-motion reverts them automatically (the section
  // then scrolls natively with everything visible).
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const matcher = gsap.matchMedia();

      matcher.add("(prefers-reduced-motion: no-preference)", () => {
        // Drifting light shafts and a breathing glow.
        q('[data-hero="ray"]').forEach((ray, index) => {
          gsap.to(ray, {
            xPercent: index % 2 === 0 ? -7 : 7,
            duration: 10 + index * 3,
            repeat: -1,
            yoyo: true,
            ease: EASE.ambient,
          });
        });
        gsap.to(q('[data-hero="glow"]'), {
          scale: 1.07,
          duration: 12,
          repeat: -1,
          yoyo: true,
          ease: EASE.ambient,
          transformOrigin: "35% 60%",
        });

        // Scroll hand-off: pin the hero and give scroll the film. At rest the
        // video loops ambiently; the first scrolled pixel grabs the playhead
        // (pause + scrub, reverse rewinds, returning to rest resumes the
        // loop). Near the pin's end, frame 0 of SECTION 2 crossfades over —
        // one continuous movie. No dim, no black, no cut.
        const scrub = scrubStateRef.current;
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: HERO_SCRUB_END,
              pin: true,
              scrub: 0.85,
              anticipatePin: 1,
              onUpdate: (self) => {
                const video = videoRef.current;
                if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
                  return;
                }
                if (self.progress <= 0.002) {
                  if (scrub.base !== null) {
                    scrub.base = null;
                    video.play().catch(() => {});
                  }
                  return;
                }
                if (scrub.base === null) {
                  scrub.base = Math.min(video.currentTime, Math.max(video.duration - 0.6, 0));
                  video.pause();
                }
                // The film reaches its final frame at 55% of the hold — the
                // bridge is complete by 60%, and Section 2's curtain slides
                // over the second half of the range.
                const filmProgress = Math.min(self.progress / 0.55, 1);
                scrub.target = scrub.base + filmProgress * (video.duration - 0.08 - scrub.base);
              },
            },
          })
          .to(q('[data-hero="indicator-wrap"]'), { autoAlpha: 0, duration: 0.18 }, 0)
          .to(
            q('[data-hero="content"]'),
            { yPercent: -24, scale: 0.96, autoAlpha: 0, duration: 0.4 },
            0,
          )
          .to(q('[data-hero="bridge"]'), { autoAlpha: 1, duration: 0.25 }, 0.35);

        // Underwater inertia on the playhead: lerp toward the scroll target
        // instead of seeking every frame.
        const applyHeroScrub = () => {
          const video = videoRef.current;
          if (!video || scrub.base === null || !Number.isFinite(video.duration)) return;
          const diff = scrub.target - video.currentTime;
          if (Math.abs(diff) < 0.02) return;
          video.currentTime += diff * 0.25;
        };
        gsap.ticker.add(applyHeroScrub);

        return () => {
          gsap.ticker.remove(applyHeroScrub);
        };
      });
    },
    { scope: sectionRef },
  );

  // Entrance choreography — re-evaluated when readiness or motion prefs
  // change; revertOnUpdate keeps each run idempotent.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);

      const headlineLines = q('[data-hero="headline-line"]');
      const entranceTargets = [
        q('[data-hero="copy"]'),
        q('[data-hero="actions"]'),
        q('[data-hero="scroll-indicator"]'),
      ];

      if (reducedMotion) {
        gsap.set(entranceTargets, { autoAlpha: 1, clearProps: "transform,filter" });
        return;
      }

      if (!ready || !introDone) {
        gsap.set(entranceTargets, { autoAlpha: 0 });
        gsap.set(headlineLines, { yPercent: REVEAL.yPercent });
        return;
      }

      // Entrance: headline rises out of its masks line by line, then
      // description → buttons → dive cue follow with blur reveals.
      const timeline = gsap.timeline({
        delay: ENTRANCE.delay,
        defaults: { duration: ENTRANCE.duration, ease: EASE.out },
      });
      timeline.fromTo(
        headlineLines,
        { yPercent: REVEAL.yPercent, filter: `blur(${REVEAL.blur}px)` },
        {
          yPercent: 0,
          filter: "blur(0px)",
          clearProps: "filter",
          duration: REVEAL.duration,
          stagger: REVEAL.stagger,
          ease: "power3.out",
        },
        ENTRANCE.stagger,
      );
      entranceTargets.forEach((target, index) => {
        timeline.fromTo(
          target,
          { autoAlpha: 0, y: ENTRANCE.y, filter: `blur(${ENTRANCE.blur}px)` },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", clearProps: "filter" },
          (index + 2) * ENTRANCE.stagger,
        );
      });
    },
    { scope: sectionRef, dependencies: [ready, introDone, reducedMotion], revertOnUpdate: true },
  );

  // Mouse parallax — desktop pointers only, and never the video layer.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const matcher = gsap.matchMedia();

    matcher.add(
      {
        fine: "(pointer: fine)",
        motionOK: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const { fine, motionOK } = context.conditions as {
          fine: boolean;
          motionOK: boolean;
        };
        if (!fine || !motionOK) return;

        const movers = [
          { selector: '[data-hero="parallax"]', strength: 9, vertical: 0.55 },
          { selector: '[data-hero="particles"]', strength: 16, vertical: 0.7 },
          { selector: '[data-hero="rays"]', strength: 26, vertical: 0.85 },
        ].flatMap(({ selector, strength, vertical }) => {
          const element = section.querySelector<HTMLElement>(selector);
          if (!element) return [];
          return {
            x: gsap.quickTo(element, "x", { duration: 1, ease: EASE.out }),
            y: gsap.quickTo(element, "y", { duration: 1, ease: EASE.out }),
            strength,
            vertical,
          };
        });

        const onMouseMove = (event: MouseEvent) => {
          const nx = (event.clientX / window.innerWidth) * 2 - 1;
          const ny = (event.clientY / window.innerHeight) * 2 - 1;
          for (const mover of movers) {
            mover.x(nx * mover.strength);
            mover.y(ny * mover.strength * mover.vertical);
          }
        };
        window.addEventListener("mousemove", onMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", onMouseMove);
      },
    );

    return () => matcher.revert();
  }, []);

  // The looping backdrop pauses while the mission film plays. Never resume
  // while scroll owns the playhead (scrub.base is set).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (missionOpen) {
      video.pause();
    } else if (ready && scrubStateRef.current.base === null) {
      video.play().catch(() => {});
    }
  }, [missionOpen, ready]);

  const handleDive = useCallback(() => {
    const chapter = document.getElementById(DIVE_TARGET_ID);
    if (chapter) {
      // Land where the chapter's frame sticks (wrapper top + one viewport),
      // riding the curtain slide on the way down.
      scrollTo(
        chapter.getBoundingClientRect().top + window.scrollY + window.innerHeight,
      );
      return;
    }
    // Phase 2 isn't mounted yet — dive to the end of the hero's pinned range,
    // which is exactly where the Descent section will begin.
    scrollTo(
      Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        window.innerHeight,
      ),
    );
  }, [scrollTo]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="HABU deep exploration exosuit"
      className="relative h-svh min-h-[600px] overflow-hidden bg-abyss"
    >
      {/* Layer 0 — the film. Never transformed, never cropped beyond cover. */}
      <HeroVideo
        videoRef={videoRef}
        onReady={markReady}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Layer 1 — volumetric light, fog and legibility scrims. */}
      <div aria-hidden="true" className="absolute inset-0">
        <div data-hero="rays" className="absolute -inset-10 mix-blend-screen will-change-transform">
          <div
            data-hero="ray"
            className="absolute -top-[20%] left-[10%] h-[150%] w-36 -rotate-[16deg] rounded-full bg-gradient-to-b from-primary/25 via-primary/10 to-transparent blur-3xl sm:w-48"
          />
          <div
            data-hero="ray"
            className="absolute -top-[25%] left-[36%] h-[150%] w-24 -rotate-[9deg] rounded-full bg-gradient-to-b from-glow/20 via-glow/5 to-transparent blur-3xl"
          />
          <div
            data-hero="ray"
            className="absolute -top-[20%] right-[16%] h-[150%] w-40 rotate-[14deg] rounded-full bg-gradient-to-b from-primary/15 to-transparent blur-3xl"
          />
        </div>
        <div
          data-hero="glow"
          className="absolute inset-0 bg-[radial-gradient(55%_45%_at_32%_58%,rgba(79,195,255,0.12),transparent_70%)] will-change-transform"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abyss/80 via-abyss/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-abyss via-abyss/60 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-full max-w-[52rem] bg-gradient-to-r from-abyss/75 via-abyss/35 to-transparent" />
      </div>

      {/* Layer 2 — bubbles and drifting motes. Bleeds past the edges so
          parallax movement never reveals a gap. */}
      <div data-hero="particles" className="absolute -inset-6 will-change-transform">
        <ParticleField className="h-full w-full" />
      </div>

      {/* Layer 3 — the bridge: frame 0 of SECTION 2, crossfaded over the hero
          at the end of the pin so the next chapter opens on identical pixels.
          preload="auto" doubles as background-buffering the next film. */}
      <div
        data-hero="bridge"
        aria-hidden="true"
        className="absolute inset-0 opacity-0"
        style={{ visibility: "hidden" }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={SECTION_TWO_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            video.pause();
            try {
              video.currentTime = 0.001;
            } catch {
              // First-frame seek before buffering; harmless.
            }
          }}
        />
      </div>

      {/* Layer 4 — content, left-anchored so the diver stays visible. */}
      <div data-hero="parallax" className="relative z-10 h-full will-change-transform">
        <div
          data-hero="content"
          className="flex h-full flex-col justify-center px-6 sm:px-12 lg:pr-8 lg:pl-[15vw]"
        >
          <h1
            data-hero="headline"
            className="text-legible font-heading max-w-[12ch] text-[clamp(3rem,7vw,6.9rem)] leading-[1.02] font-bold tracking-[-0.035em] text-white"
          >
            {["Built Beyond", "Human Limits."].map((line) => (
              <span key={line} className="-mb-[0.09em] block overflow-hidden pb-[0.09em]">
                <span data-hero="headline-line" className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p
            data-hero="copy"
            className="text-legible mt-7 max-w-[620px] text-lg leading-relaxed text-mist opacity-0 sm:text-xl"
          >
            Designed for extreme underwater exploration where pressure, predators,
            and the unknown become part of every mission.
          </p>
          <div
            data-hero="actions"
            className="mt-10 flex flex-col gap-5 opacity-0 sm:flex-row sm:items-center"
          >
            <Button variant="hero" size="heroLg" onClick={handleDive}>
              Begin the Dive
              <ChevronsDown className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="heroGhost"
              size="heroLg"
              onClick={() => setMissionOpen(true)}
            >
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full border border-white/25 bg-white/10"
              >
                <Play className="size-3 fill-current" />
              </span>
              Watch Mission
            </Button>
          </div>
        </div>
      </div>

      {/* Layer 5 — dive cue. */}
      <div
        data-hero="indicator-wrap"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-7"
      >
        <ScrollIndicator className="opacity-0" />
      </div>

      <PreloadVeil ready={ready} />
      <MissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />
    </section>
  );
}
