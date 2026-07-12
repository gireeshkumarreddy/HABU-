"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollTarget = string | number | HTMLElement;

type ExperienceContextValue = {
  /** True once the hero video is buffered and the cinematic entrance may begin. */
  ready: boolean;
  /** Called by the hero once its video can play through. */
  markReady: () => void;
  /** True once the opening logo ritual has crossfaded out (or was skipped). */
  introDone: boolean;
  /** Called by the intro as its crossfade begins, so the hero enters underneath it. */
  markIntroDone: () => void;
  /** Live `prefers-reduced-motion` state — sections must branch on this. */
  reducedMotion: boolean;
  /**
   * Smooth-scroll to a selector, element, or absolute pixel offset.
   * Silently no-ops when a selector has no match (future-phase anchors).
   */
  scrollTo: (target: ScrollTarget) => void;
  /** Freeze scrolling (modals, overlays). */
  stopScroll: () => void;
  /** Release a previous stopScroll(). */
  startScroll: () => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);

    if (query.matches) {
      return () => query.removeEventListener("change", onChange);
    }

    // Floatier lerp + slightly damped wheel = neutral-buoyancy scrolling.
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenisRef.current = lenis;

    const onLenisScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onLenisScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      query.removeEventListener("change", onChange);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const markReady = useCallback(() => setReady(true), []);
  const markIntroDone = useCallback(() => setIntroDone(true), []);

  const scrollTo = useCallback(
    (target: ScrollTarget) => {
      const resolved =
        typeof target === "string"
          ? document.querySelector<HTMLElement>(target)
          : target;
      if (resolved === null) return;

      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(resolved, { duration: 1.4 });
        return;
      }
      if (typeof resolved === "number") {
        window.scrollTo({ top: resolved, behavior: reducedMotion ? "auto" : "smooth" });
      } else {
        resolved.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    },
    [reducedMotion],
  );

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
    document.documentElement.classList.add("scroll-locked");
  }, []);

  const startScroll = useCallback(() => {
    lenisRef.current?.start();
    document.documentElement.classList.remove("scroll-locked");
  }, []);

  const value = useMemo(
    () => ({
      ready,
      markReady,
      introDone,
      markIntroDone,
      reducedMotion,
      scrollTo,
      stopScroll,
      startScroll,
    }),
    [ready, markReady, introDone, markIntroDone, reducedMotion, scrollTo, stopScroll, startScroll],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within <ExperienceProvider>");
  }
  return context;
}
