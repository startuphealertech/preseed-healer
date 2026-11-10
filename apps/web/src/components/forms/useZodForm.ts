"use client";

import { useCallback, useState } from "react";
import type { ZodType } from "zod";
import { ApiClientError } from "@/lib/client-api";

type Errors = Record<string, string>;
export type FormStatus = "idle" | "submitting" | "success";

/**
 * Minimal form state for Zod schemas shared with the API: per-field errors,
 * partial validation for multi-step forms, and server error mapping.
 */
export function useZodForm<T extends Record<string, unknown>>(schema: ZodType<any, any>, initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");

  const set = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name as string]) return e;
      const { [name as string]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  /** Validates all fields, or only `fields` (for a wizard step). Returns parsed data or null. */
  const validate = useCallback(
    (fields?: (keyof T)[]) => {
      const result = schema.safeParse(values);
      if (result.success) {
        setErrors({});
        return result.data as unknown;
      }
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "_");
        if (fields && !fields.includes(key as keyof T)) continue;
        next[key] ??= issue.message;
      }
      setErrors(next);
      if (fields && Object.keys(next).length === 0) return true;
      focusFirstError(next);
      return null;
    },
    [schema, values],
  );

  const handleServerError = useCallback((err: unknown) => {
    if (err instanceof ApiClientError) {
      if (err.fields) {
        const mapped = Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k.split(".")[0]!, v[0] ?? "Invalid"]));
        setErrors(mapped);
        focusFirstError(mapped);
      }
      setFormError(err.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
    setStatus("idle");
  }, []);

  return { values, errors, status, setStatus, formError, setFormError, set, validate, handleServerError, setErrors };
}

export type FormApi<T extends Record<string, unknown>> = ReturnType<typeof useZodForm<T>>;

function focusFirstError(errors: Errors) {
  const first = Object.keys(errors)[0];
  if (!first) return;
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}
