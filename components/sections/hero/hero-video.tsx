"use client";

import { useEffect, useRef, type RefObject } from "react";

export const HERO_VIDEO_SRC = "/assets/00_Hero_Animation.mp4";

type HeroVideoProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Fires exactly once, when the video is buffered enough to play through. */
  onReady: () => void;
  className?: string;
};

/**
 * The cinematic backdrop. Preloads before the experience reveals itself
 * (the PreloadVeil holds the frame until `onReady`), then autoplays muted
 * on an infinite loop. object-cover keeps the source framing intact while
 * filling the viewport at any aspect ratio.
 */
export function HeroVideo({ videoRef, onReady, className }: HeroVideoProps) {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      video.play().catch(() => {
        // Autoplay was blocked despite muted+playsinline; retry on first input.
        const resume = () => video.play().catch(() => {});
        window.addEventListener("pointerdown", resume, { once: true });
      });
      onReadyRef.current();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      fire();
      return;
    }

    const onCanPlayThrough = () => fire();
    const onCanPlay = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) fire();
    };
    video.addEventListener("canplaythrough", onCanPlayThrough);
    video.addEventListener("canplay", onCanPlay);

    // Slow networks: begin once we have current-frame data rather than hanging.
    const soft = window.setTimeout(() => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) fire();
    }, 3500);
    // Never trap the visitor behind the veil.
    const hard = window.setTimeout(fire, 7000);

    return () => {
      video.removeEventListener("canplaythrough", onCanPlayThrough);
      video.removeEventListener("canplay", onCanPlay);
      window.clearTimeout(soft);
      window.clearTimeout(hard);
    };
  }, [videoRef]);

  return (
    <>
      <link rel="preload" as="video" href={HERO_VIDEO_SRC} />
      <video
        ref={videoRef}
        className={className}
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
