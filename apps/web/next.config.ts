import type { NextConfig } from "next";

const API_URL = (process.env.API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@preseedhealer/types"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Uploaded images are served by the API through the /api/v1 rewrite below.
    localPatterns: [{ pathname: "/api/v1/uploads/**", search: "" }, { pathname: "/**" }],
  },

  /**
   * The browser only ever talks to this origin: /api/v1/* is proxied to the Express API.
   * Admin session cookies stay first-party and no CORS is needed.
   */
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_URL}/:path*` }];
  },

  /** URL migrations from the previous site structure. */
  async redirects() {
    return [
      { source: "/legal/application-selection-disclaimer", destination: "/legal/application-selection", permanent: true },
      { source: "/news", destination: "/insights", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/event", destination: "/summit-2026", permanent: true },
    ];
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
