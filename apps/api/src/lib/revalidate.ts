import { env } from "../config/env";

/**
 * Asks the Next.js app to drop cached pages for these tags.
 * Fire-and-forget: a failure must never fail the admin's write.
 */
export function revalidateWeb(tags: string[]): void {
  const unique = [...new Set(tags.filter(Boolean))];
  if (unique.length === 0) return;

  fetch(new URL("/api/revalidate", env.WEB_URL), {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags: unique }),
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) console.warn(`[revalidate] web responded ${res.status} for ${unique.join(",")}`);
    })
    .catch((err: Error) => console.warn(`[revalidate] failed for ${unique.join(",")}: ${err.message}`));
}
