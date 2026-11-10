import "server-only";
import type { ApiResponse } from "@preseedhealer/types";

const API_URL = (process.env.API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

type FetchOpts = {
  /** Seconds before Next re-fetches in the background (ISR). Admin edits also revalidate on demand via tags. */
  revalidate?: number | false;
  /** Cache tags, invalidated by /api/revalidate when admin edits content. */
  tags?: string[];
  timeoutMs?: number;
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Server-side GET against the Express API with ISR caching. */
export async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { revalidate = 600, tags, timeoutMs = 8000 } = opts;

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate, tags },
    signal: AbortSignal.timeout(timeoutMs),
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!body) throw new ApiRequestError(res.status, "BAD_RESPONSE", `Non-JSON response from ${path}`);
  if (!body.ok) throw new ApiRequestError(res.status, body.error.code, body.error.message);
  return body.data;
}

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * During `next build` an unreachable API shouldn't fail the build: pages render with the
 * fallback and ISR refreshes them once the API is up. At runtime errors propagate, so ISR
 * keeps serving the last good page instead of caching an empty one.
 */
export async function withBuildFallback<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (isBuild()) {
      console.warn(`[build] ${label}: API unavailable, using fallback (${(err as Error).message})`);
      return fallback;
    }
    throw err;
  }
}

/** Returns null on 404 (→ notFound()), rethrows anything else. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}
