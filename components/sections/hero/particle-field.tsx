"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const TAU = Math.PI * 2;

type Bubble = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  alpha: number;
};

type Mote = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
};

function spawnBubble(width: number, height: number, anywhere = false): Bubble {
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + 12,
    radius: 1 + Math.random() * 3,
    speed: 18 + Math.random() * 30,
    sway: 6 + Math.random() * 14,
    swaySpeed: 0.4 + Math.random() * 0.7,
    phase: Math.random() * TAU,
    alpha: 0.08 + Math.random() * 0.16,
  };
}

function spawnMote(width: number, height: number): Mote {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.4 + Math.random() * 0.9,
    vx: (Math.random() - 0.5) * 6,
    vy: -(2 + Math.random() * 6),
    alpha: 0.05 + Math.random() * 0.2,
    pulse: Math.random() * TAU,
    pulseSpeed: 0.5 + Math.random() * 1.5,
  };
}

/**
 * One canvas renders both particle systems (rising bubbles + drifting motes)
 * so the whole atmosphere costs a single compositing layer and one rAF hook
 * on the shared GSAP ticker. Density scales with viewport area, DPR is
 * capped at 2, and rendering pauses when the tab is hidden or the canvas
 * leaves the viewport. Renders nothing under prefers-reduced-motion.
 */
export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let bubbles: Bubble[] = [];
    let motes: Mote[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const bubbleTarget = Math.max(6, Math.min(20, Math.round(area / 90_000)));
      const moteTarget = Math.max(16, Math.min(54, Math.round(area / 30_000)));
      while (bubbles.length < bubbleTarget) bubbles.push(spawnBubble(width, height, true));
      while (motes.length < moteTarget) motes.push(spawnMote(width, height));
      bubbles = bubbles.slice(0, bubbleTarget);
      motes = motes.slice(0, moteTarget);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let tabVisible = !document.hidden;
    const onVisibility = () => {
      tabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let inView = true;
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    intersection.observe(canvas);

    const tick = (_time: number, deltaMs: number) => {
      if (!tabVisible || !inView) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const bubble of bubbles) {
        bubble.y -= bubble.speed * dt;
        bubble.phase += bubble.swaySpeed * dt;
        if (bubble.y < -12) Object.assign(bubble, spawnBubble(width, height));
        const x = bubble.x + Math.sin(bubble.phase) * bubble.sway;

        ctx.beginPath();
        ctx.arc(x, bubble.y, bubble.radius, 0, TAU);
        ctx.strokeStyle = `rgba(167, 231, 255, ${bubble.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = `rgba(79, 195, 255, ${bubble.alpha * 0.25})`;
        ctx.fill();
      }

      for (const mote of motes) {
        mote.x += mote.vx * dt;
        mote.y += mote.vy * dt;
        mote.pulse += mote.pulseSpeed * dt;
        if (mote.y < -4) {
          mote.y = height + 4;
          mote.x = Math.random() * width;
        }
        if (mote.x < -4) mote.x = width + 4;
        else if (mote.x > width + 4) mote.x = -4;

        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius, 0, TAU);
        ctx.fillStyle = `rgba(183, 194, 207, ${mote.alpha * (0.6 + 0.4 * Math.sin(mote.pulse))})`;
        ctx.fill();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
