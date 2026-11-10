import { NextResponse, type NextRequest } from "next/server";
import { renderMarkdown } from "@/lib/markdown";

/**
 * Admin editor live preview: Markdown → the same sanitised HTML the public site renders.
 * Stateless and side-effect free; limited to signed-in sessions to avoid casual abuse.
 */
export async function POST(req: NextRequest) {
  if (!req.cookies.has("psh_session")) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { markdown?: unknown } | null;
  const md = typeof body?.markdown === "string" ? body.markdown.slice(0, 200_000) : "";
  return NextResponse.json({ ok: true, data: renderMarkdown(md) });
}
