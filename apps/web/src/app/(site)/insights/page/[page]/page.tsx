import { notFound, permanentRedirect } from "next/navigation";
import { InsightsListing } from "@/components/content/InsightsListing";
import { PageHero } from "@/components/ui/PageHero";
import { getCategories, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ page: string }> };

function parsePage(raw: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
}

export async function generateMetadata({ params }: Props) {
  const page = parsePage((await params).page) ?? 1;
  return buildMetadata({
    title: `Insights: Page ${page}`,
    description: `Startup fundraising guides and PreSeedHealer updates, page ${page}.`,
    path: `/insights/page/${page}`,
  });
}

export default async function InsightsPaged({ params }: Props) {
  const page = parsePage((await params).page);
  if (!page) notFound();
  if (page === 1) permanentRedirect("/insights");

  const [list, categories] = await Promise.all([getPosts({ page }), getCategories()]);
  if (page > list.pages) notFound();

  return (
    <>
      <PageHero
        eyebrow="PreSeedHealer journal"
        title="News & insights"
        description={`Page ${page} of ${list.pages}`}
        breadcrumbs={[
          { name: "Insights", path: "/insights" },
          { name: `Page ${page}`, path: `/insights/page/${page}` },
        ]}
        tone="light"
      />
      <InsightsListing list={list} categories={categories} pageHref={(p) => (p === 1 ? "/insights" : `/insights/page/${p}`)} />
    </>
  );
}
