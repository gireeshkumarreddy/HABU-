import dynamic from "next/dynamic";
import { HeroSection } from "@/components/sections/hero/hero-section";

/**
 * The HABU film — one continuous, fully video-driven scroll experience.
 *
 * Intro ritual (layout-level overlay) → hero (chapter zero: loops at rest,
 * scroll scrubs it, holds its frame while the reel's first scene slides
 * over) → the film reel: sticky-stacked, scroll-scrubbed MP4 chapters.
 * Chapter copy and runway lengths live in
 * components/sections/film/film.config.ts.
 *
 * The experience currently ends at Section 2 — the remaining story is being
 * redesigned. Resume by appending chapters in film.config.ts.
 */
const FilmReel = dynamic(() =>
  import("@/components/sections/film/film-reel").then((mod) => mod.FilmReel),
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FilmReel />
    </>
  );
}
