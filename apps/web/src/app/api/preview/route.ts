import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Admin editor live preview: Markdown → the same sanitised HTML the public site renders.
 * Stateless and side-effect free. Available to any signed-in admin or editor (both edit content);
 * the session is verified by the API, so forged, expired or logged-out cookies are rejected.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    return fail(503, "UNAVAILABLE", "Can't verify your session right now. Please try again.");
  }
  if (!user) return fail(401, "UNAUTHORIZED", "Please sign in");

  const body = (await req.json().catch(() => null)) as { markdown?: unknown } | null;
  const md = typeof body?.markdown === "string" ? body.markdown.slice(0, 200_000) : "";
  return NextResponse.json({ ok: true, data: renderMarkdown(md) }, { headers: { "Cache-Control": "no-store" } });
}
