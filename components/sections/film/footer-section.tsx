"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { REVEAL } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FooterSectionProps = {
  id: string;
  src: string;
  ariaLabel: string;
  /** Scroll runway in viewport-heights. */
  length: number;
  zIndex: number;
  isLast?: boolean;
};

const HEADING_LINES = ["The Ocean Tested Every Limit.", "The Suit Passed Every One."];
const DESCRIPTION =
  "Every challenge throughout the journey proved that true exploration depends on engineering, precision, and reliability. The mission may be complete, but the next adventure is only beginning.";

type Hotspot = {
  id: string;
  label: string;
  /** Rect in percentages of the 16:9 video frame. */
  rect: { x: number; y: number; w: number; h: number };
  /** "top" scrolls back to the surface; href scrolls to an anchor. */
  action?: "top";
  href?: string;
  external?: string;
};

/**
 * The film renders its own footer UI (MISSION COMPLETE panel, HABU lockup,
 * nav, socials, BUY NOW). These invisible-but-focusable hotspots sit exactly
 * over those baked elements — inside a CSS box that reproduces the video's
 * object-cover geometry, nested in the camera so they track the push-in —
 * turning the film's UI into the real one. Hover lights the pixels beneath.
 */
const HOTSPOTS: Hotspot[] = [
  // Rects measured against the rendered frame (1440×900 ground truth).
  { id: "continue", label: "Continue — start your next mission", rect: { x: 41, y: 81, w: 21, h: 11.5 }, action: "top" },
  { id: "home", label: "HABU — back to the surface", rect: { x: 3.5, y: 84, w: 15.5, h: 12 }, action: "top" },
  { id: "technology", label: "Technology", rect: { x: 24, y: 92.5, w: 11.5, h: 6 }, href: "#technology" },
  { id: "specifications", label: "Specifications", rect: { x: 37.5, y: 92.5, w: 13.7, h: 6 }, href: "#specifications" },
  { id: "contact", label: "Contact", rect: { x: 54, y: 92.5, w: 9.8, h: 6 }, href: "#contact" },
  { id: "privacy", label: "Privacy", rect: { x: 66.3, y: 92.5, w: 9.5, h: 6 }, href: "#privacy" },
  // Platform roots as placeholders — swap for real profiles when known.
  { id: "linkedin", label: "LinkedIn", rect: { x: 84.2, y: 84.5, w: 4, h: 7.5 }, external: "https://www.linkedin.com" },
  { id: "github", label: "GitHub", rect: { x: 89, y: 84.5, w: 4, h: 7.5 }, external: "https://github.com" },
  { id: "youtube", label: "YouTube", rect: { x: 93.8, y: 84.5, w: 4, h: 7.5 }, external: "https://www.youtube.com" },
  { id: "buy", label: "Buy now", rect: { x: 81, y: 92, w: 15, h: 7 }, href: "#product" },
];

/**
 * The final chapter — the end of the film. The scene scrubs with scroll
 * like every chapter while a locked camera makes a slow ~2% push across the
 * section. The footage carries its own mission-complete UI; we add only
 * what it lacks: the closing copy in the open water above the panel, a
 * breathing glow on the baked title, ambient light, and real interactivity
 * mapped onto the rendered controls.
 */
export function FooterSection({
  id,
  src,
  ariaLabel,
  length,
  zIndex,
  isLast = true,
}: FooterSectionProps) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTarget = useRef(0);
  const { reducedMotion, scrollTo } = useExperience();

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const q = gsap.utils.selector(wrapper);
      const matcher = gsap.matchMedia();

      matcher.add("(prefers-reduced-motion: no-preference)", () => {
        const coveredTail = () => window.innerHeight * (isLast ? 1 : 2);
        const scrubDistance = () => Math.max(wrapper.offsetHeight - coveredTail(), 1);

        const scrubTrigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top top",
          end: () => `+=${scrubDistance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressTarget.current = self.progress;
          },
        });

        // Entrance — a settle-from-scale instead of the usual y-parallax:
        // the footer's frame must stay edge-exact (its baked UI lives in the
        // bottom 8% of the film), so no vertical bleed is available. Scale
        // always covers, and the curtain weight reads the same.
        gsap.fromTo(
          q('[data-footer="parallax"]'),
          { scale: 1.06 },
          {
            scale: 1,
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

        // Scrubbed choreography: copy arrives, then HOLDS to the end.
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${scrubDistance()}`,
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
        // Pin duration to 1 so positions are true fractions of the scrub.
        tl.to({}, { duration: 1 }, 0);

        // The locked camera's slow push — subtle, so the baked UI barely
        // grows. Hotspots live inside the camera and track it exactly.
        tl.to(q('[data-footer="camera"]'), { scale: 1.02, ease: "none", duration: 1 }, 0);

        tl.fromTo(
          q('[data-footer="heading-line"]'),
          { yPercent: REVEAL.yPercent, filter: `blur(${REVEAL.blur}px)` },
          { yPercent: 0, filter: "blur(0px)", duration: 0.08, stagger: 0.025 },
          0.18,
        );
        tl.fromTo(
          q('[data-footer="description"]'),
          { autoAlpha: 0, y: 26, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.06 },
          0.27,
        );

        // Ambient life — time-based, independent of scroll.
        gsap.to(q('[data-footer="float"]'), {
          y: 5,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        // The baked MISSION COMPLETE title breathes — an additive glow
        // pulsing over its pixels.
        gsap.to(q('[data-footer="title-glow"]'), {
          opacity: 0.85,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        q('[data-footer="ray"]').forEach((ray, index) => {
          gsap.to(ray, {
            xPercent: index % 2 === 0 ? -5 : 5,
            opacity: 0.5,
            duration: 9 + index * 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });

        // Playhead — scroll owns the film, same engine as every chapter.
        const applyTime = (_time: number, deltaMs: number) => {
          const video = videoRef.current;
          if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
          if (video.readyState < 2) return;
          const epsilon = 1 / 48;
          const target = progressTarget.current * Math.max(video.duration - epsilon, 0);
          const step = Math.min(deltaMs || 16.67, 50) / 16.67;
          const factor = 1 - Math.pow(1 - 0.2, step);
          const next = video.currentTime + (target - video.currentTime) * factor;
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
          video.currentTime = Math.max(progressTarget.current * (video.duration || 0), 0.001);
        } catch {
          // Pre-buffer seeks can throw; the scrub ticker recovers.
        }
      }}
    />
  );

  const hotspotAttrs = (spot: Hotspot) => ({
    style: {
      left: `${spot.rect.x}%`,
      top: `${spot.rect.y}%`,
      width: `${spot.rect.w}%`,
      height: `${spot.rect.h}%`,
    },
    className: cn(
      "absolute rounded-lg transition-[background-color,box-shadow] duration-300",
      "hover:bg-primary/10 hover:shadow-[0_0_26px_rgba(79,195,255,0.3)]",
      "focus-visible:bg-primary/10 focus-visible:shadow-[0_0_26px_rgba(79,195,255,0.35)]",
      "cursor-pointer",
    ),
  });

  /**
   * Mirrors the video's object-cover geometry in CSS: a centered 16:9 box at
   * least as large as the frame — hotspot percentages inside it line up with
   * the film's pixels at every viewport size.
   */
  const hotspotLayer = (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
      <div className="pointer-events-auto relative aspect-video min-h-full min-w-full flex-none">
        {/* Breathing glow over the baked MISSION COMPLETE title. */}
        <div
          data-footer="title-glow"
          aria-hidden="true"
          className="pointer-events-none absolute top-[68%] left-1/2 h-[14%] w-[46%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,195,255,0.28),transparent_70%)] opacity-30 mix-blend-screen blur-md"
        />
        {HOTSPOTS.map((spot) =>
          spot.external ? (
            <a
              key={spot.id}
              href={spot.external}
              target="_blank"
              rel="noreferrer"
              aria-label={spot.label}
              {...hotspotAttrs(spot)}
            />
          ) : (
            <a
              key={spot.id}
              href={spot.href ?? "#hero"}
              aria-label={spot.label}
              onClick={(event) => {
                event.preventDefault();
                if (spot.action === "top" || !spot.href) {
                  scrollTo(0);
                } else {
                  scrollTo(spot.href);
                }
              }}
              {...hotspotAttrs(spot)}
            />
          ),
        )}
      </div>
    </div>
  );

  // Reduced motion: the closing frame, calm and complete.
  if (reducedMotion) {
    return (
      <footer id={id} aria-label={ariaLabel} className="relative overflow-hidden bg-abyss">
        <div className="relative flex min-h-svh flex-col items-center px-6 pt-24 text-center">
          {videoElement}
          <div className="relative z-10 flex max-w-3xl flex-col items-center">
            <h2 className="font-heading text-[clamp(1.9rem,3.2vw,3.1rem)] leading-[1.1] font-bold tracking-[-0.03em] text-white [text-shadow:0_1px_3px_rgba(2,11,22,0.7)]">
              {HEADING_LINES.join(" ")}
            </h2>
            <p className="text-legible mt-5 max-w-[620px] text-base leading-relaxed text-mist">
              {DESCRIPTION}
            </p>
          </div>
          {hotspotLayer}
        </div>
      </footer>
    );
  }

  return (
    <footer
      ref={wrapperRef as React.RefObject<HTMLElement | null>}
      id={id}
      aria-label={ariaLabel}
      className="relative -mt-[100svh]"
      style={{ height: `${length * 100}svh`, zIndex }}
    >
      <div data-film="frame" className="sticky top-0 h-svh overflow-hidden bg-abyss">
        <div data-footer="parallax" className="absolute inset-0 will-change-transform">
          <div data-footer="camera" className="absolute inset-0 will-change-transform">
            {/* ±5px buoyant float — the 6px bleed keeps edges covered while
                leaving the baked bottom bar effectively edge-exact. */}
            <div data-footer="float" className="absolute -inset-[6px]">
              {videoElement}
              {hotspotLayer}
            </div>
          </div>
        </div>

        {/* Gentle light over the calm scene. */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-10 mix-blend-screen">
          <div
            data-footer="ray"
            className="absolute -top-[18%] left-[16%] h-[150%] w-36 -rotate-[13deg] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl"
          />
          <div
            data-footer="ray"
            className="absolute -top-[22%] right-[20%] h-[150%] w-28 rotate-[11deg] rounded-full bg-gradient-to-b from-glow/12 to-transparent blur-3xl"
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-abyss/90 via-abyss/35 to-transparent"
        />

        {/* Closing copy — the open water above the film's own panel. */}
        <div className="pointer-events-none absolute inset-x-0 top-[16%] z-10 flex flex-col items-center px-6 text-center sm:top-[18%]">
          <h2 className="font-heading max-w-[26ch] text-[clamp(1.9rem,3.2vw,3.1rem)] leading-[1.1] font-bold tracking-[-0.03em] text-white [text-shadow:0_1px_3px_rgba(2,11,22,0.7)]">
            {HEADING_LINES.map((line) => (
              <span key={line} className="-mb-[0.09em] block overflow-hidden pb-[0.09em]">
                <span data-footer="heading-line" className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <p
            data-footer="description"
            className="text-legible mt-5 max-w-[600px] text-sm leading-relaxed text-mist opacity-0 sm:text-base"
          >
            {DESCRIPTION}
          </p>
        </div>
      </div>
    </footer>
  );
}
