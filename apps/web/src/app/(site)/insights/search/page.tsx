import { InsightsListing } from "@/components/content/InsightsListing";
import { PageHero } from "@/components/ui/PageHero";
import { getCategories, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

// Search result pages shouldn't be indexed (thin/duplicate content).
export const metadata = buildMetadata({ title: "Search insights", path: "/insights/search", noIndex: true });

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const [list, categories] = await Promise.all([
    q ? getPosts({ q, page }) : getPosts({ page: 1 }),
    getCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Search"
        title={q ? `Results for “${q}”` : "Search insights"}
        description={q ? `${list.total} article${list.total === 1 ? "" : "s"} found` : undefined}
        breadcrumbs={[
          { name: "Insights", path: "/insights" },
          { name: "Search", path: "/insights/search" },
        ]}
        tone="light"
      />
      <InsightsListing
        list={list}
        categories={categories}
        query={q}
        pageHref={(p) => `/insights/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ""}`}
      />
    </>
  );
}
