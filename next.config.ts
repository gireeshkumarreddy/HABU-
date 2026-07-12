import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole experience is client-rendered over static assets — no SSR,
  // API routes, or ISR — so it exports to a fully static site. This also
  // lets us deploy the prebuilt `out/` directory directly (no build service).
  output: "export",
  images: {
    // Required for static export: serve the (already-sized) images as-is.
    unoptimized: true,
  },
};

export default nextConfig;
