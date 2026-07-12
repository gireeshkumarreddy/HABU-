"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useExperience } from "@/components/providers/experience-provider";
import { HERO_VIDEO_SRC } from "./hero-video";

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

type MissionModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Cinematic player for "Watch Mission" — replays the mission film full-bleed
 * with sound and native controls. Portaled to <body> because the hero section
 * is transformed while pinned, which would trap position:fixed descendants.
 */
export function MissionModal({ open, onClose }: MissionModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const { stopScroll, startScroll } = useExperience();
  const reducedMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    stopScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, video, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      startScroll();
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose, stopScroll, startScroll]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-80 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
        >
          <div
            className="absolute inset-0 bg-abyss/85 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="HABU mission film"
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-abyss shadow-[0_0_80px_rgba(79,195,255,0.18)]"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97, y: reducedMotion ? 0 : 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: PANEL_EASE }}
          >
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close mission film"
              className="absolute top-3 right-3 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-abyss/70 text-white backdrop-blur-md transition-colors duration-300 hover:border-primary/60 hover:text-glow"
            >
              <X className="size-4.5" />
            </button>
            <video
              className="aspect-video w-full"
              src={HERO_VIDEO_SRC}
              autoPlay
              controls
              playsInline
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
