import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getPost } from "@/lib/content";

export const alt = `${siteConfig.name} Insights`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Per-article social card: category + title on the brand gradient. */
export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPost(slug).catch(() => null);
  const title = data?.post.title ?? `${siteConfig.name} Insights`;
  const category = data?.post.category?.name ?? "Insights";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b1530 0%, #15224a 55%, #1d36a8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f59e0b" }} />
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 3 }}>{category}</div>
          <div style={{ marginTop: 18, fontSize: title.length > 70 ? 54 : 64, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#b9bfd1" }}>{siteConfig.domain}</div>
      </div>
    ),
    size,
  );
}
