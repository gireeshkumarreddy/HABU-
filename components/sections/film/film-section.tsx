"use client";

import { useEffect, useRef } from "react";
import { ScrollIndicator } from "@/components/sections/hero/scroll-indicator";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { REVEAL } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ChapterContent } from "./film.config";

type FilmSectionProps = {
  id: string;
  src: string;
  ariaLabel: string;
  /** Scroll runway in viewport-heights (includes the 1vh being-covered tail). */
  length: number;
  /** Stacking position — each chapter renders above the one it covers. */
  zIndex: number;
  /** Last chapter: nothing covers it, so its scrub runs to the page end. */
  isLast?: boolean;
  content?: ChapterContent;
};

/**
 * One scene of the film. The wrapper is a tall scroll runway and the frame
 * is `position: sticky` — a pin without ScrollTrigger's pin-spacer, so the
 * scene holds full-screen while the visitor scrubs through it and never
 * "releases" with a jump. The next chapter (pulled up one viewport by the
 * reel) slides over this one while it is still stuck, and this frame recedes
 * beneath it (scale, drift, dim); the last chapter simply holds at the page
 * end. The video's playhead IS the scroll position (see the scrub loop
 * below) — forward scroll plays forward, reverse rewinds. Storytelling
 * content (label → masked heading lines → description → support → dive cue)
 * rides the same scrub so it choreographs in both directions.
 *
 * Requires all-intra source video — see film.config.ts.
 */
export function FilmSection({
  id,
  src,
  ariaLabel,
  length,
  zIndex,
  isLast = false,
  content,
}: FilmSectionProps) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTarget = useRef(0);
  const { reducedMotion } = useExperience();

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const q = gsap.utils.selector(wrapper);
      const matcher = gsap.matchMedia();

      matcher.add("(prefers-reduced-motion: no-preference)", () => {
        const coveredTail = () => window.innerHeight * (isLast ? 1 : 2);
        const scrubDistance = () => Math.max(wrapper.offsetHeight - coveredTail(), 1);

        // Playhead — scroll position maps to film progress while stuck.
        const scrubTrigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top top",
          end: () => `+=${scrubDistance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressTarget.current = self.progress;
          },
        });

        // Entrance counter-parallax: while this scene slides up over the
        // previous one, its film lags a few percent — a curtain with weight.
        gsap.fromTo(
          q('[data-film="parallax"]'),
          { yPercent: -6.5 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: "top top",
              scrub: 0.85,
              invalidateOnRefresh: true,
            },
          },
        );

        // Recede while the next scene covers us — never a release, only depth.
        if (!isLast) {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: wrapper,
                start: () =>
                  wrapper.getBoundingClientRect().top +
                  window.scrollY +
                  wrapper.offsetHeight -
                  window.innerHeight * 2,
                end: () =>
                  wrapper.getBoundingClientRect().top +
                  window.scrollY +
                  wrapper.offsetHeight -
                  window.innerHeight,
                scrub: 0.9,
                invalidateOnRefresh: true,
              },
            })
            .to(q('[data-film="frame"]'), { scale: 0.964, yPercent: -3 }, 0)
            .to(q('[data-film="recede"]'), { opacity: 0.32 }, 0);
        }

        // Storytelling overlay — in after the scene settles, out before the
        // cover arrives. Fractions of the scrub, so fully reversible.
        if (content) {
          const contentTimeline = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: wrapper,
              start: "top top",
              end: () => `+=${scrubDistance()}`,
              scrub: 0.9,
              invalidateOnRefresh: true,
            },
          });
          contentTimeline
            .fromTo(
              q('[data-film="label"]'),
              { autoAlpha: 0, y: 22, filter: "blur(6px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.05 },
              0.05,
            )
            .fromTo(
              q('[data-film="heading-line"]'),
              { yPercent: REVEAL.yPercent, filter: `blur(${REVEAL.blur}px)` },
              { yPercent: 0, filter: "blur(0px)", duration: 0.08, stagger: 0.02 },
              0.08,
            )
            .fromTo(
              q('[data-film="description"]'),
              { autoAlpha: 0, y: 26, filter: "blur(6px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.06 },
              0.15,
            )
            .fromTo(
              q('[data-film="support"]'),
              { autoAlpha: 0, y: 24, filter: "blur(5px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.06 },
              0.19,
            )
            .fromTo(
              q('[data-film="indicator"]'),
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.05 },
              0.23,
            )
            .to(
              [
                q('[data-film="label"]'),
                q('[data-film="heading"]'),
                q('[data-film="description"]'),
                q('[data-film="support"]'),
                q('[data-film="indicator"]'),
              ],
              {
                autoAlpha: 0,
                y: -34,
                filter: "blur(6px)",
                duration: 0.09,
                stagger: 0.012,
                ease: "power2.in",
              },
              0.68,
            );
        }

        // The playhead. Scroll sets the target; every rAF tick eases the
        // video's currentTime toward it. The clip is all-intra (every frame a
        // keyframe) so each seek resolves in one frame — no decode chain, no
        // stall — which is what lets this feel like scrubbing a movie rather
        // than a stuttering <video>. Smoothing is frame-rate independent so
        // 60Hz and 120Hz displays share the same water-like inertia.
        const SMOOTH = 0.2; // approach per 60fps frame
        const applyTime = (_time: number, deltaMs: number) => {
          const video = videoRef.current;
          if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
          if (video.readyState < 2) return; // HAVE_CURRENT_DATA — avoid seeking dry
          const epsilon = 1 / 48; // stay just off the final frame (can render blank)
          const target = progressTarget.current * Math.max(video.duration - epsilon, 0);
          const step = Math.min(deltaMs || 16.67, 50) / 16.67;
          const factor = 1 - Math.pow(1 - SMOOTH, step);
          const next = video.currentTime + (target - video.currentTime) * factor;
          // Dead zone under ~a third of a frame — kills idle micro-seeks that
          // would otherwise keep the decoder busy at rest.
          if (Math.abs(next - video.currentTime) < 0.008) return;
          video.currentTime = next;
        };
        gsap.ticker.add(applyTime);

        return () => {
          gsap.ticker.remove(applyTime);
          scrubTrigger.kill();
        };
      });
    },
    { scope: wrapperRef },
  );

  // Background preloading: buffer the whole chapter once it is near, which
  // also pre-buffers the NEXT chapter while the current one plays.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.preload = "auto";
        video.load();
        observer.disconnect();
      },
      { rootMargin: "130% 0px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const videoElement = (
    // object-cover: fills the viewport edge-to-edge at native aspect ratio
    // (cinematic full-bleed, no letterbox, no distortion). The source is
    // served uncompressed by the browser at its full resolution.
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      muted
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        video.pause();
        try {
          video.currentTime = Math.max(
            progressTarget.current * (video.duration || 0),
            0.001,
          );
        } catch {
          // Pre-buffer seeks can throw; the scrub ticker recovers.
        }
      }}
    />
  );

  const side = content?.side ?? "left";
  const isRight = side === "right";

  const contentOverlay = content ? (
    <>
      {/* Readability scrim behind the copy (spec: 20–30% dark gradient),
          hugging whichever edge the column sits on so the diver stays clear. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 w-full max-w-[54rem]",
          isRight
            ? "right-0 bg-gradient-to-l from-abyss/70 via-abyss/30 to-transparent"
            : "left-0 bg-gradient-to-r from-abyss/70 via-abyss/30 to-transparent",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-12",
          isRight ? "items-end text-right lg:pr-[15vw]" : "lg:pl-[15vw]",
        )}
      >
        <p
          data-film="label"
          className={cn(
            "flex items-center gap-3 text-[11px] font-semibold tracking-[0.42em] text-primary/90 uppercase opacity-0",
            isRight && "flex-row-reverse",
          )}
        >
          <span aria-hidden="true" className="h-px w-10 bg-primary/50" />
          {content.label}
        </p>
        <h2
          data-film="heading"
          className="font-heading mt-7 text-[clamp(2.5rem,4.6vw,4.5rem)] leading-[1.06] font-bold tracking-[-0.03em] text-white"
        >
          {content.headingLines.map((line) => (
            <span key={line} className="block overflow-hidden pb-[0.09em] -mb-[0.09em]">
              <span data-film="heading-line" className="block will-change-transform">
                {line}
              </span>
            </span>
          ))}
        </h2>
        {content.description && (
          <p
            data-film="description"
            className="text-legible mt-7 max-w-[560px] text-lg leading-relaxed text-mist opacity-0 sm:text-xl"
          >
            {content.description}
          </p>
        )}
        {content.support && (
          <p
            data-film="support"
            className="text-legible mt-5 max-w-[480px] text-[15px] leading-relaxed text-mist/70 opacity-0"
          >
            {content.support}
          </p>
        )}
        <div
          data-film="indicator"
          className={cn("mt-12 opacity-0", isRight ? "self-end" : "self-start")}
        >
          <ScrollIndicator label={content.indicatorLabel} />
        </div>
      </div>
    </>
  ) : null;

  // Reduced motion: the same scene as a calm, unstacked frame — no runway,
  // no scrub, content simply present.
  if (reducedMotion) {
    return (
      <section
        id={id}
        aria-label={ariaLabel}
        className="relative flex min-h-svh items-center overflow-hidden bg-abyss"
      >
        {videoElement}
        {content && (
          <div
            className={cn(
              "relative z-10 flex flex-col px-6 py-24 sm:px-12",
              isRight ? "ml-auto items-end text-right lg:pr-[15vw]" : "lg:pl-[15vw]",
            )}
          >
            <p className="text-[11px] font-semibold tracking-[0.42em] text-primary/90 uppercase">
              {content.label}
            </p>
            <h2 className="font-heading mt-6 text-[clamp(2.5rem,4.6vw,4.5rem)] leading-[1.06] font-bold tracking-[-0.03em] text-white">
              {content.headingLines.join(" ")}
            </h2>
            {content.description && (
              <p className="text-legible mt-6 max-w-[560px] text-lg leading-relaxed text-mist">
                {content.description}
              </p>
            )}
            {content.support && (
              <p className="text-legible mt-4 max-w-[480px] text-[15px] leading-relaxed text-mist/70">
                {content.support}
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      id={id}
      aria-label={ariaLabel}
      className="relative -mt-[100svh]"
      style={{ height: `${length * 100}svh`, zIndex }}
    >
      <div data-film="frame" className="sticky top-0 h-svh overflow-hidden bg-abyss">
        {/* Vertical bleed lets the entrance counter-parallax move the film
            without ever exposing an edge. */}
        <div data-film="parallax" className="absolute inset-x-0 -inset-y-[8%]">
          {videoElement}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-abyss/90 via-abyss/35 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-abyss/90 via-abyss/35 to-transparent"
        />
        {contentOverlay}
        <div
          data-film="recede"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-abyss opacity-0"
        />
      </div>
    </section>
  );
}
