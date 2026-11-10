"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "@/config/site";
import { cn } from "@/lib/cn";
import { isActive } from "./NavLinks";

type Props = { items: NavItem[]; applyHref: string };

/** Off-canvas drawer for < lg. Closes on route change, Escape, or backdrop tap; locks body scroll. */
export function MobileNav({ items, applyHref }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Close whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        className="relative z-50 inline-flex size-11 items-center justify-center rounded-full text-ink-900 hover:bg-ink-100"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-ink-950/40" aria-hidden="true" onClick={() => setOpen(false)} />
      )}

      <nav
        id={panelId}
        aria-label="Mobile"
        hidden={!open}
        className={cn(
          "fixed inset-x-0 top-0 z-40 max-h-dvh overflow-y-auto rounded-b-3xl bg-white px-4 pb-8 shadow-2xl",
          "pt-[calc(env(safe-area-inset-top,0px)+5rem)] sm:px-6",
        )}
      >
        <ul className="flex flex-col">
          {items.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="border-b border-ink-100 last:border-0">
                <Link
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center justify-between font-display text-lg font-medium",
                    active ? "text-brand-600" : "text-ink-900",
                  )}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-ink-300">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={applyHref}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-500 font-semibold text-ink-900 hover:bg-accent-400"
        >
          Apply now <span aria-hidden="true">→</span>
        </Link>
      </nav>
    </div>
  );
}
