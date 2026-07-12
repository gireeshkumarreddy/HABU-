# HABU — Deep Exploration Systems

A cinematic, single-scroll landing experience for the HABU deep-ocean exosuit.
Built like a AAA game intro crossed with Apple product storytelling.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP +
ScrollTrigger · Lenis smooth scroll · Framer Motion (overlays only) ·
shadcn/ui · Lucide icons · Inter.

```bash
npm run dev    # develop at http://localhost:3000
npm run build  # production build
```

## Phase roadmap

The experience currently ends at **Section 7** — the interactive product
inspection (`components/sections/film/product-section.tsx`: the SECTION 7
film plays first, then scroll drives a transform camera over the held final
frame through helmet → arm → life-support → boots → overview, with
holographic connectors and glass spec panels; stops/copy live in that file's
`INSPECT_STOPS`). There is no Section 4 — it was removed from the story; ids
follow the client's numbering. Still to come: Section 8 and the footer.

**Scrub videos must be all-intra.** `currentTime` seeking can only land on
keyframes; a normal inter-frame MP4 (one keyframe every few seconds) stalls
and freezes while scrubbing. Re-encode every chapter clip so every frame is a
keyframe before adding it:
`ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 16 -x264-params keyint=1:min-keyint=1:scenecut=0 -pix_fmt yuv420p -movflags +faststart out.mp4`

| Phase | Section | Status |
| ----- | ------- | ------ |
| 1 | Hero — the surface (film loops at rest, scroll scrubs it) | ✅ built |
| 2 | Intro logo ritual · premium header (BUY NOW) · scroll-scrubbed film chapters | ✅ built |
| 3 | Fully video-driven reel, sticky scene-stack, all-intra scrub | ✅ built |
| 4 | Section 2 (left copy) + Section 3 (right copy, MISSION 02) | ✅ built |
| 5 | Section 5 (left copy, MISSION 03 — the shark encounter) | ✅ built |
| 6 | Section 6 (right copy, MISSION 04 — through the gate) | ✅ built |
| 7 | Section 7 — interactive product inspection (camera rig + spec panels) | ✅ built |
| 8 | Footer (`footer-section.tsx`, id `contact`) — the film's own baked mission-complete UI made functional via hotspots, closing copy overlay, breathing title glow | ✅ built |
| — | Section 8 (story) | planned |

Footer notes: the client's footage renders its own complete footer UI
(MISSION COMPLETE / CONTINUE ▶ YES panel, HABU lockup, nav, socials, BUY
NOW). Rather than duplicating it in HTML, invisible accessible hotspots map
onto the baked controls (see `HOTSPOTS` in footer-section.tsx — rects are
percentages of the 16:9 frame inside a CSS box that mirrors object-cover
geometry, so they stay aligned at every viewport and track the camera
push-in). Social hotspots point at platform roots — swap for real profile
URLs. The footer frame is edge-exact (no vertical parallax bleed; scale
entrance instead) so the baked bar stays in view.

Film-architecture notes: the reel (`components/sections/film/`) is a sticky
scene-stack — **no chapter pinning**. Each `<FilmSection>` is a scroll runway
(`length` × 100svh) with a `position: sticky` frame; every chapter pulls
itself up one viewport (`-mt-[100svh]`, contained by the reel's `flow-root`)
so it slides OVER the still-stuck previous scene, which recedes beneath it
(scale/dim) and is covered before it ever releases. The playhead of every
video IS scroll (lerped ~0.22 for underwater inertia; no autoplay, no loops).
Copy + runway lengths live in `film.config.ts`; the hero holds its frame for
190% while the first chapter's curtain covers it. All imagery is gone — the
site is 100% video-driven. Headings use the `--font-display` token (Geist
display treatment today; Clash Display drop-in documented in globals.css).

## Architecture conventions (read before adding a phase)

- **One provider owns scroll.** `components/providers/experience-provider.tsx`
  runs Lenis on the GSAP ticker, exposes `scrollTo`, `stopScroll`/`startScroll`
  (used by overlays), the shared `ready` flag, and live `reducedMotion` state.
- **Sections are self-contained.** Each phase is a client component under
  `components/sections/<phase>/` that owns its own pinned ScrollTrigger
  timeline. Mount new phases in `app/page.tsx` with `next/dynamic` so they
  lazy-load. The hero's scrub ends on a near-black abyss frame — Phase 2
  should open on that same frame so the cut is invisible.
- **Motion tokens are shared.** Durations, eases, and stagger live in
  `lib/motion.ts`; nav targets and copy constants in `lib/site.ts`.
- **Brand tokens are CSS variables.** `abyss / primary / glow / mist` are
  defined in `app/globals.css` (`@theme`) alongside the shadcn semantic set —
  no raw hex in components.
- **z-index scale:** section internals 0–10 · header 40 · mobile menu 50 ·
  preload veil 70 · modals 80 · skip link 100.
- **Accessibility is non-negotiable.** Every animated element needs a
  `prefers-reduced-motion` branch (GSAP work goes through `reducedMotion`
  from the provider; CSS keyframes are disabled globally in `globals.css`).
- **Assets** live in `public/assets/` with normalized names
  (`00_Hero_Animation.mp4`, `01_Descent_Keyframe_01.png`, …) — future-phase
  keyframes are already there.
