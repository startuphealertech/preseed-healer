"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex min-h-9 items-center text-sm font-medium text-ink-500 hover:text-ink-900">
            ← {back.label}
          </Link>
        )}
        <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const btnBase = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50";
export const btn = {
  primary: cn(btnBase, "bg-ink-900 text-white hover:bg-ink-800"),
  secondary: cn(btnBase, "border border-ink-200 bg-white text-ink-800 hover:bg-ink-50"),
  danger: cn(btnBase, "border border-danger-500/30 bg-white text-danger-700 hover:bg-danger-50"),
  ghost: cn(btnBase, "text-ink-600 hover:bg-ink-100"),
};

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-ink-200 bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const pillTones: Record<string, string> = {
  published: "bg-success-50 text-success-700",
  draft: "bg-ink-100 text-ink-600",
  new: "bg-brand-50 text-brand-700",
  reviewing: "bg-accent-100 text-accent-700",
  contacted: "bg-accent-100 text-accent-700",
  shortlisted: "bg-success-50 text-success-700",
  onboarded: "bg-success-50 text-success-700",
  rejected: "bg-danger-50 text-danger-700",
  declined: "bg-danger-50 text-danger-700",
  unread: "bg-brand-50 text-brand-700",
  read: "bg-ink-100 text-ink-600",
  yes: "bg-success-50 text-success-700",
  no: "bg-ink-100 text-ink-600",
};

export function Pill({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", pillTones[value] ?? "bg-ink-100 text-ink-700")}>
      {value.replace(/-/g, " ")}
    </span>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-100" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}

/** Two-click delete: no blocking confirm() dialog, no accidental deletes. */
export function ConfirmButton({ onConfirm, children = "Delete", className }: { onConfirm: () => Promise<void> | void; children?: ReactNode; className?: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onBlur={() => setArmed(false)}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
      className={cn(armed ? cn(btnBase, "bg-danger-500 text-white hover:bg-danger-700") : btn.danger, className)}
    >
      {busy ? "Deleting…" : armed ? "Click again to confirm" : children}
    </button>
  );
}

export function Toast({ message, tone = "success", onDone }: { message: string; tone?: "success" | "error"; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => done.current(), 3500);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div
      role="status"
      className={cn(
        "fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50 animate-slide-up rounded-xl px-4 py-3 text-sm font-semibold shadow-xl",
        tone === "success" ? "bg-ink-900 text-white" : "bg-danger-500 text-white",
      )}
    >
      {message}
    </div>
  );
}

export const adminInput =
  "block min-h-10 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
