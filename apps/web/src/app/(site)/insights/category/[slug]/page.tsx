import { notFound } from "next/navigation";
import { InsightsListing } from "@/components/content/InsightsListing";
import { PageHero } from "@/components/ui/PageHero";
import { getCategories, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return buildMetadata({
    title: `${cat.name}: Insights`,
    description: cat.description || `${cat.name} articles for Indian startup founders from PreSeedHealer.`,
    path: `/insights/category/${slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [list, categories] = await Promise.all([getPosts({ category: slug, page }), getCategories()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <>
      <PageHero
        eyebrow="Insights category"
        title={cat.name}
        description={cat.description}
        breadcrumbs={[
          { name: "Insights", path: "/insights" },
          { name: cat.name, path: `/insights/category/${slug}` },
        ]}
        tone="light"
      />
      <InsightsListing
        list={list}
        categories={categories}
        activeCategory={slug}
        pageHref={(p) => (p === 1 ? `/insights/category/${slug}` : `/insights/category/${slug}?page=${p}`)}
      />
    </>
  );
}
