import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Page-number list with ellipses: 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): (number | "…")[] {
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/** Crawlable link-based pagination. `href(1)` should be the canonical first page. */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const btn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(btn, "text-ink-700 hover:bg-ink-100")} aria-label="Previous page">
          <Icon name="chevronLeft" />
        </Link>
      ) : (
        <span className={cn(btn, "text-ink-300")} aria-hidden="true">
          <Icon name="chevronLeft" />
        </span>
      )}
      <ul className="flex items-center gap-1">
        {pageList(page, pages).map((p, i) =>
          p === "…" ? (
            <li key={`e${i}`} className="px-1 text-ink-400" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(btn, p === page ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100")}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={cn(btn, "text-ink-700 hover:bg-ink-100")} aria-label="Next page">
          <Icon name="chevronRight" />
        </Link>
      ) : (
        <span className={cn(btn, "text-ink-300")} aria-hidden="true">
          <Icon name="chevronRight" />
        </span>
      )}
    </nav>
  );
}
