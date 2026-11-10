"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PARTNER_TYPE_LABELS, type Partner, type PartnerType } from "@preseedhealer/types";
import { cn } from "@/lib/cn";

/**
 * Category filter tabs over a server-rendered grid. Every card is in the HTML (good for SEO);
 * filtering only toggles visibility on the client.
 */
export function PartnerDirectory({ partners, cards }: { partners: Partner[]; cards: Record<string, ReactNode> }) {
  const [active, setActive] = useState<PartnerType | "all">("all");

  const types = useMemo(() => {
    const present = new Set(partners.map((p) => p.type));
    return (Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).filter((t) => present.has(t));
  }, [partners]);

  const count = (t: PartnerType | "all") => (t === "all" ? partners.length : partners.filter((p) => p.type === t).length);

  if (partners.length === 0) {
    return <p className="rounded-2xl bg-ink-50 p-8 text-center text-ink-600">Partners will be listed here once confirmed.</p>;
  }

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Filter by category"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {(["all", ...types] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={active === t}
            onClick={() => setActive(t)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
              active === t ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
            )}
          >
            {t === "all" ? "All" : PARTNER_TYPE_LABELS[t]}
            <span className={cn("text-xs", active === t ? "text-ink-300" : "text-ink-400")}>{count(t)}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {count(active)} {active === "all" ? "partners" : PARTNER_TYPE_LABELS[active]}
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <li key={p.id} hidden={active !== "all" && p.type !== active}>
            {cards[p.id]}
          </li>
        ))}
      </ul>
    </div>
  );
}
