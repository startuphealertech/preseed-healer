import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image for every page that doesn't set its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0b1530 0%, #15224a 60%, #1d36a8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#f59e0b" }} />
          {siteConfig.shortName}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            {siteConfig.tagline}
          </div>
          <div style={{ marginTop: 24, fontSize: 30, color: "#b9bfd1" }}>{siteConfig.name}</div>
        </div>
      </div>
    ),
    size,
  );
}
