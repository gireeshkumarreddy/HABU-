import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — Built Beyond Human Limits.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          position: "relative",
          background: "linear-gradient(135deg, #020B16 0%, #062A44 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -120,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(79,195,255,0.30) 0%, rgba(79,195,255,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 26,
            letterSpacing: 14,
            color: "#4FC3FF",
            display: "flex",
          }}
        >
          {`${SITE.name.toUpperCase()} · ${SITE.tagline.toUpperCase()}`}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 92,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.05,
            display: "flex",
            maxWidth: 900,
          }}
        >
          Built Beyond Human Limits.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#B7C2CF",
            maxWidth: 780,
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Designed for extreme underwater exploration where pressure, predators,
          and the unknown become part of every mission.
        </div>
      </div>
    ),
    { ...size },
  );
}
