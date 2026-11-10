import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Called by the Express API after an admin edits content:
 *   POST /api/revalidate  { "tags": ["settings"] }  with header x-revalidate-secret
 */
function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!secretMatches(req.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Bad secret" } }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0) : [];
  if (tags.length === 0) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "tags[] required" } }, { status: 400 });
  }

  // expire: 0 → next request fetches fresh data instead of serving stale.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, data: { revalidated: tags } });
}
