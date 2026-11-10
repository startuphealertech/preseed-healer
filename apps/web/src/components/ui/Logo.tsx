import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/** Placeholder wordmark. Replace the SVG with the real logo when available. */
export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex min-h-11 items-center gap-2.5", className)}
      aria-label={`${siteConfig.name}, home`}
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-ink-900" />
        <path d="M9 22 16 9l7 13" className="fill-none stroke-accent-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="20" r="2.2" className="fill-white" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-bold tracking-tight", tone === "light" ? "text-white" : "text-ink-900")}>
          {siteConfig.shortName}
        </span>
        <span className={cn("mt-0.5 hidden text-[0.65rem] font-medium tracking-wide sm:block", tone === "light" ? "text-ink-300" : "text-ink-500")}>
          {siteConfig.name}
        </span>
      </span>
    </Link>
  );
}
