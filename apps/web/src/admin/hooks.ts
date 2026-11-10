"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/client-api";

/** GET an admin endpoint with loading/error state and a reload() handle. Pass null to skip. */
export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(!!path);
  const ctrl = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError("");
    try {
      const d = await api<T>(path, { signal: c.signal });
      if (!c.signal.aborted) setData(d);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (err instanceof ApiClientError && err.status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent(location.pathname)}`;
        return;
      }
      setError((err as Error).message);
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
    return () => ctrl.current?.abort();
  }, [load]);

  return { data, setData, error, loading, reload: load };
}

/** Read/write a nested value by dotted path ("seo.title"). */
export function getPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath<T extends Record<string, any>>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  if (!head) return obj;
  if (rest.length === 0) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath((obj[head] as Record<string, any>) ?? {}, rest.join("."), value) };
}

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
