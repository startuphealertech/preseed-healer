import { InsightsListing } from "@/components/content/InsightsListing";
import { PageHero } from "@/components/ui/PageHero";
import { getCategories, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Insights: Startup Fundraising News & Guides",
  description:
    "Guides on pre-seed fundraising, pitch decks and government schemes for Indian startups, plus official PreSeedHealer programme updates.",
  path: "/insights",
});

export default async function InsightsPage() {
  const [list, categories] = await Promise.all([getPosts({ page: 1 }), getCategories()]);
  return (
    <>
      <PageHero
        eyebrow="PreSeedHealer journal"
        title="News & insights"
        description="Practical guides for founders raising early capital, and official updates from the programme."
        breadcrumbs={[{ name: "Insights", path: "/insights" }]}
        tone="light"
      />
      <InsightsListing list={list} categories={categories} pageHref={(p) => (p === 1 ? "/insights" : `/insights/page/${p}`)} />
    </>
  );
}
