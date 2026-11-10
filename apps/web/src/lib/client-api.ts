import type { ApiResponse } from "@preseedhealer/types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Opts = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; signal?: AbortSignal };

/** Browser → same-origin /api/v1 proxy → Express API. Sends the admin session cookie automatically. */
export async function api<T>(path: string, { method = "GET", body, signal }: Opts = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      headers: body !== undefined && !isForm ? { "content-type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiClientError(0, "NETWORK", "Can't reach the server. Check your connection and try again.");
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    throw new ApiClientError(res.status, "BAD_RESPONSE", res.status >= 500 ? "The server is unavailable. Please try again shortly." : "Unexpected response from server.");
  }
  if (!json.ok) throw new ApiClientError(res.status, json.error.code, json.error.message, json.error.fields);
  return json.data;
}
