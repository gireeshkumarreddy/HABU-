"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExperience } from "@/components/providers/experience-provider";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, ENTRANCE } from "@/lib/motion";
import { LOGO_SRC, NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const MENU_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Floating glass chrome — near-invisible blur at the surface, deeper glass
 * once descending. It stays out of the opening entirely: it fades in only
 * after the hero's own entrance has finished (intro → hero → header).
 */
const HEADER_ENTRANCE_DELAY =
  ENTRANCE.delay + ENTRANCE.stagger * 4 + ENTRANCE.duration;

export function SiteHeader() {
  const headerRef = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { ready, introDone, reducedMotion, scrollTo, stopScroll, startScroll } =
    useExperience();
  const menuReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;
      if (reducedMotion) {
        gsap.set(header, { autoAlpha: 1 });
        return;
      }
      if (!ready || !introDone) {
        gsap.set(header, { autoAlpha: 0 });
        return;
      }
      gsap.fromTo(
        header,
        { autoAlpha: 0, y: -16, filter: "blur(8px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          // Transform must be cleared too: a transformed (or filtered) header
          // becomes the containing block for position:fixed descendants.
          clearProps: "filter,transform",
          duration: 1,
          delay: HEADER_ENTRANCE_DELAY,
          ease: EASE.out,
        },
      );
    },
    { dependencies: [ready, introDone, reducedMotion], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!menuOpen) return;
    stopScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      startScroll();
    };
  }, [menuOpen, stopScroll, startScroll]);

  const goTo = (href: string) => {
    setMenuOpen(false);
    scrollTo(href);
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b opacity-0 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500",
        scrolled
          ? "border-white/[0.06] bg-abyss/60 shadow-[0_8px_32px_rgba(2,11,22,0.45)] backdrop-blur-xl"
          : "border-transparent bg-abyss/10 backdrop-blur-[6px]",
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-5 sm:h-[72px] sm:px-8 lg:px-12">
        <Link href="/" aria-label="HABU home" className="group flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-primary/25 bg-black shadow-[0_0_18px_rgba(79,195,255,0.22)] transition-[box-shadow,transform] duration-500 group-hover:scale-[1.04] group-hover:shadow-[0_0_30px_rgba(79,195,255,0.5)]">
            <Image
              src={LOGO_SRC}
              alt=""
              width={96}
              height={64}
              priority
              className="h-full w-full scale-[1.9] object-cover"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-[0.32em] text-white">
              {SITE.name}
            </span>
            <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.22em] text-mist/80">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={(event) => {
                event.preventDefault();
                goTo(href);
              }}
              className="nav-link px-0.5 py-2 text-[13px] font-medium"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="hero"
            size="heroSm"
            className="hidden tracking-[0.12em] sm:inline-flex"
            onClick={() => goTo("#product")}
          >
            BUY NOW
          </Button>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white backdrop-blur-md transition-colors duration-300 hover:border-primary/50 lg:hidden"
          >
            <Menu className="size-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Portaled to <body>: the header animates transform/filter during its
          entrance, which would otherwise trap this fixed overlay inside the
          64px header box (same containing-block rule as the mission modal). */}
      {mounted &&
        createPortal(
          <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: menuReducedMotion ? 0 : 0.25 }}
          >
            <div className="absolute inset-0 bg-abyss/85 backdrop-blur-2xl" />
            <motion.div
              className="relative flex h-full flex-col px-6 pt-24 pb-10"
              initial={{ opacity: 0, y: menuReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: menuReducedMotion ? 0 : 12 }}
              transition={{ duration: menuReducedMotion ? 0 : 0.35, ease: MENU_EASE }}
            >
              <button
                type="button"
                autoFocus
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-5 flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors duration-300 hover:border-primary/50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>

              <nav aria-label="Primary" className="flex flex-col gap-2">
                {NAV_LINKS.map(({ label, href }, index) => (
                  <motion.a
                    key={href}
                    href={href}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(href);
                    }}
                    className="font-heading rounded-lg py-3 text-4xl font-semibold tracking-[-0.02em] text-white transition-colors duration-300 hover:text-glow"
                    initial={{ opacity: 0, y: menuReducedMotion ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: menuReducedMotion ? 0 : 0.4,
                      delay: menuReducedMotion ? 0 : 0.06 * index,
                      ease: MENU_EASE,
                    }}
                  >
                    {label}
                  </motion.a>
                ))}
              </nav>

              <div className="mt-auto">
                <Button
                  variant="hero"
                  size="heroLg"
                  className="w-full tracking-[0.12em]"
                  onClick={() => goTo("#product")}
                >
                  BUY NOW
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  );
}
