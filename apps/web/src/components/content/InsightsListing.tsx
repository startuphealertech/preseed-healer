import Link from "next/link";
import type { Category } from "@preseedhealer/types";
import { PostGrid } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";
import type { PostList } from "@/lib/content";

/** Shared body for /insights, /insights/page/[n], /insights/category/[slug] and search. */
export function InsightsListing({
  list,
  categories,
  activeCategory,
  pageHref,
  query,
}: {
  list: PostList;
  categories: Category[];
  activeCategory?: string;
  pageHref: (p: number) => string;
  query?: string;
}) {
  const visibleCats = categories.filter((c) => (c.postCount ?? 0) > 0);
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
            <ul className="flex gap-2">
              {[{ name: "All", slug: "", postCount: undefined }, ...visibleCats].map((c) => {
                const active = (activeCategory ?? "") === c.slug && !query;
                return (
                  <li key={c.slug || "all"}>
                    <Link
                      href={c.slug ? `/insights/category/${c.slug}` : "/insights"}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap",
                        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-700 hover:border-ink-300",
                      )}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <form action="/insights/search" role="search" className="relative w-full lg:w-72">
            <label htmlFor="insights-q" className="sr-only">
              Search insights
            </label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" />
            <input
              id="insights-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search insights…"
              maxLength={80}
              className="min-h-11 w-full rounded-full border border-ink-200 bg-white pr-4 pl-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </form>
        </div>

        {list.items.length === 0 ? (
          <div className="mt-12 rounded-2xl bg-ink-50 p-10 text-center">
            <p className="font-display text-lg font-semibold">{query ? `No results for “${query}”` : "No articles yet"}</p>
            <p className="mt-2 text-ink-600">{query ? "Try a different keyword or browse all insights." : "Check back soon for updates."}</p>
            {query && (
              <Link href="/insights" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-700 underline">
                Browse all insights
              </Link>
            )}
          </div>
        ) : (
          <PostGrid posts={list.items} className="mt-10" firstPriority />
        )}

        <Pagination page={list.page} pages={list.pages} href={pageHref} />
      </Container>
    </section>
  );
}
