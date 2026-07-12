"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ProductSectionProps = {
  id: string;
  src: string;
  ariaLabel: string;
  /** Scroll runway in viewport-heights (includes the 1vh tail when not last). */
  length: number;
  zIndex: number;
  isLast?: boolean;
};

/** Fraction of the scrub spent playing the intro film (suit walks into pose). */
const VIDEO_PHASE = 0.2;
/** Where each inspection beat starts, and how much scrub one beat occupies. */
const FIRST_STOP = 0.24;
const STOP_SPAN = 0.14;

type InspectStop = {
  id: string;
  title: string;
  blurb: string;
  specs: { label: string; value: string }[];
  /**
   * Focal point of the component in the held frame (fractions of the frame),
   * and how far the camera pushes in. The camera rig centers this point.
   */
  focus: { x: number; y: number; scale: number };
  panelSide: "left" | "right";
};

const INSPECT_STOPS: InspectStop[] = [
  {
    id: "helmet",
    title: "Command Helmet",
    blurb: "Sealed optics and a full-face HUD that keeps vision calm at crushing depth.",
    specs: [
      { label: "Rated depth", value: "1,200 m" },
      { label: "Field of view", value: "210°" },
      { label: "HUD refresh", value: "120 Hz" },
    ],
    focus: { x: 0.5, y: 0.21, scale: 2.2 },
    panelSide: "right",
  },
  {
    id: "arm",
    title: "Arm Protection",
    blurb: "Layered composite armor that bends like fabric and lands like a shield.",
    specs: [
      { label: "Material", value: "Graphene-ceramic weave" },
      { label: "Impact rating", value: "40 kN" },
      { label: "Mobility", value: "Full articulation" },
    ],
    focus: { x: 0.385, y: 0.55, scale: 2.2 },
    panelSide: "left",
  },
  {
    id: "oxygen",
    title: "Life-Support Core",
    blurb: "A closed-loop breathing system that manages pressure faster than the ocean can change it.",
    specs: [
      { label: "Capacity", value: "18 h mixed-gas" },
      { label: "Pressure", value: "Adaptive 4–310 bar" },
      { label: "Emergency reserve", value: "45 min isolated loop" },
    ],
    focus: { x: 0.5, y: 0.38, scale: 2.0 },
    panelSide: "right",
  },
  {
    id: "boots",
    title: "Propulsion Boots",
    blurb: "Grounded on rock, weightless off it — stability and thrust in one platform.",
    specs: [
      { label: "Grip", value: "Micro-spine soles" },
      { label: "Propulsion", value: "Vectored micro-thrust" },
      { label: "Balance", value: "Gyro auto-trim" },
    ],
    focus: { x: 0.5, y: 0.85, scale: 2.25 },
    panelSide: "left",
  },
];

const OVERVIEW = {
  label: "THE EXOSUIT",
  title: "Built for the Unknown",
  blurb: "One system engineered for pressure, predators, and the dark — so the mission continues.",
  stats: [
    { value: "1,200 m", label: "Max operating depth" },
    { value: "18 h", label: "Mission endurance" },
    { value: "40 kN", label: "Impact survival" },
  ],
};

/**
 * Camera math: translate the scaled frame so the focal point sits at the
 * viewport center, clamped so the frame always covers the viewport.
 */
function cameraVars(focus: InspectStop["focus"]) {
  const limit = 50 * (focus.scale - 1);
  const clamp = (value: number) => Math.max(-limit, Math.min(limit, value));
  return {
    scale: focus.scale,
    xPercent: clamp((0.5 - focus.x) * 100 * focus.scale),
    yPercent: clamp((0.5 - focus.y) * 100 * focus.scale),
  };
}

/**
 * The product experience. Phase one: the SECTION 7 film scrubs like every
 * other chapter and ends on the suit's hero pose. Phase two: the held final
 * frame becomes the product scene — a transform "camera" floats into each
 * component (helmet → arm → life-support → boots), the rest of the suit
 * dims, a holographic connector draws out to a glass spec panel, then the
 * camera settles back before the next stop. Ends on a full-suit overview.
 * Everything rides one scrubbed timeline, so every beat reverses smoothly.
 */
export function ProductSection({
  id,
  src,
  ariaLabel,
  length,
  zIndex,
  isLast = false,
}: ProductSectionProps) {
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

        const scrubTrigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top top",
          end: () => `+=${scrubDistance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressTarget.current = self.progress;
          },
        });

        // Entrance counter-parallax — identical language to every chapter.
        gsap.fromTo(
          q('[data-product="parallax"]'),
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

        // Recede while a following scene covers us (inactive while last).
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
            .to(q('[data-product="recede"]'), { opacity: 0.32 }, 0);
        }

        // The inspection choreography — one master timeline, fraction-based.
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${scrubDistance()}`,
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
        // Pin the timeline's duration to exactly 1 so positions are true
        // fractions of the scrub (a timeline otherwise ends at its last
        // tween, compressing every position by that factor).
        tl.to({}, { duration: 1 }, 0);

        const camera = q('[data-product="camera"]');
        const dim = q('[data-product="dim"]');

        INSPECT_STOPS.forEach((stop, index) => {
          const base = FIRST_STOP + index * STOP_SPAN;
          const group = q(`[data-product-stop="${stop.id}"]`);
          const line = q(`[data-product-stop="${stop.id}"] [data-product="line"]`);
          const panel = q(`[data-product-stop="${stop.id}"] [data-product="panel"]`);

          // Float in — the camera drifts into the component. Every beat sums
          // to exactly STOP_SPAN so returns never overlap the next approach.
          tl.to(camera, { ...cameraVars(stop.focus), duration: 0.045 }, base);
          tl.to(dim, { opacity: 1, duration: 0.035, ease: "sine.inOut" }, base);
          // Holographic connector draws, panel surfaces.
          tl.fromTo(group, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: "none" }, base + 0.048);
          tl.fromTo(
            line,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.02, ease: "power2.out" },
            base + 0.05,
          );
          tl.fromTo(
            panel,
            { autoAlpha: 0, y: 18, filter: "blur(6px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.022, ease: "power2.out" },
            base + 0.058,
          );
          // Close and float back to the full suit.
          tl.to(group, { autoAlpha: 0, duration: 0.015, ease: "power2.in" }, base + 0.095);
          tl.to(camera, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.03 }, base + 0.11);
          tl.to(dim, { opacity: 0, duration: 0.03, ease: "sine.inOut" }, base + 0.11);
        });

        // Full-suit overview — holds to the end of the page.
        tl.fromTo(
          q('[data-product="overview"]'),
          { autoAlpha: 0, y: 26, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.035, ease: "power2.out" },
          0.84,
        );

        // Playhead for the intro film: scroll maps to the first VIDEO_PHASE
        // of the scrub, then the final frame holds for the inspection.
        const applyTime = (_time: number, deltaMs: number) => {
          const video = videoRef.current;
          if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
          if (video.readyState < 2) return;
          const epsilon = 1 / 48;
          const filmProgress = Math.min(progressTarget.current / VIDEO_PHASE, 1);
          const target = filmProgress * Math.max(video.duration - epsilon, 0);
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

  // Buffer the chapter once it is near (same lazy strategy as every chapter).
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
          video.currentTime = Math.max(
            Math.min(progressTarget.current / VIDEO_PHASE, 1) * (video.duration || 0),
            0.001,
          );
        } catch {
          // Pre-buffer seeks can throw; the scrub ticker recovers.
        }
      }}
    />
  );

  const specPanel = (stop: InspectStop) => (
    <div
      key={stop.id}
      data-product-stop={stop.id}
      className={cn(
        "pointer-events-none absolute inset-x-4 bottom-8 z-20 flex items-center opacity-0",
        "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2",
        stop.panelSide === "right"
          ? "sm:left-1/2 sm:flex-row"
          : "sm:right-1/2 sm:flex-row-reverse",
      )}
    >
      {/* Node + holographic connector, drawn from the inspected component. */}
      <span
        aria-hidden="true"
        className="hidden size-2 shrink-0 rounded-full bg-primary shadow-[0_0_12px_rgba(79,195,255,0.9)] sm:block"
      />
      <span
        aria-hidden="true"
        data-product="line"
        className={cn(
          "hidden h-px w-[9vw] shrink-0 sm:block",
          stop.panelSide === "right"
            ? "origin-left bg-gradient-to-r from-primary/80 to-primary/15"
            : "origin-right bg-gradient-to-l from-primary/80 to-primary/15",
        )}
      />
      <div
        data-product="panel"
        className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_44px_rgba(79,195,255,0.14)] backdrop-blur-xl sm:w-[344px]"
      >
        <h3 className="font-heading text-xl font-semibold tracking-[-0.01em] text-white">
          {stop.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">{stop.blurb}</p>
        <dl className="mt-5 space-y-3 border-t border-white/10 pt-4">
          {stop.specs.map((spec) => (
            <div key={spec.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[10px] font-semibold tracking-[0.22em] text-mist/60 uppercase">
                {spec.label}
              </dt>
              <dd className="text-right font-mono text-sm text-glow">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );

  const overviewPanel = (
    <div
      data-product="overview"
      className="pointer-events-none absolute inset-x-4 bottom-8 z-20 flex justify-center opacity-0 sm:inset-x-0"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.06] p-7 shadow-[0_0_44px_rgba(79,195,255,0.14)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold tracking-[0.42em] text-primary/90 uppercase">
          {OVERVIEW.label}
        </p>
        <h3 className="font-heading mt-2 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
          {OVERVIEW.title}
        </h3>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-mist">{OVERVIEW.blurb}</p>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
          {OVERVIEW.stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-mono text-lg text-glow sm:text-xl">{stat.value}</div>
              <div className="mt-1 text-[10px] leading-snug tracking-[0.14em] text-mist/60 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Reduced motion: the suit and the overview, calm and complete.
  if (reducedMotion) {
    return (
      <section
        id={id}
        aria-label={ariaLabel}
        className="relative flex min-h-svh items-end justify-center overflow-hidden bg-abyss pb-16"
      >
        {videoElement}
        <div className="relative z-10 w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-white/10 bg-abyss/70 p-7 backdrop-blur-xl">
            <p className="text-[10px] font-semibold tracking-[0.42em] text-primary/90 uppercase">
              {OVERVIEW.label}
            </p>
            <h3 className="font-heading mt-2 text-2xl font-bold text-white">{OVERVIEW.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{OVERVIEW.blurb}</p>
          </div>
        </div>
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
        <div data-product="parallax" className="absolute inset-x-0 -inset-y-[8%]">
          {/* The camera: scroll floats this into each component. Scale ≥ 1
              always, so the frame never exposes an edge. */}
          <div data-product="camera" className="absolute inset-0 will-change-transform">
            {videoElement}
          </div>
        </div>
        {/* Inspection focus — the centered component stays lit while the
            rest of the suit falls into shadow. */}
        <div
          data-product="dim"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,transparent_16%,rgba(2,11,22,0.62)_58%)] opacity-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-abyss/90 via-abyss/35 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-abyss/90 via-abyss/35 to-transparent"
        />
        {INSPECT_STOPS.map(specPanel)}
        {overviewPanel}
        <div
          data-product="recede"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-abyss opacity-0"
        />
      </div>
    </section>
  );
}
