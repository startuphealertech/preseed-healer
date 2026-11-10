import { notFound } from "next/navigation";
import { legalNav } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { getPage, getPages } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Not found", robots: { index: false } };
  return buildMetadata({
    title: page.seo.title || page.title,
    description: page.seo.description || `${page.title} for PreSeedHealer (preseedhealer.com).`,
    path: `/legal/${slug}`,
  });
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const { html } = renderMarkdown(page.content);

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={page.title}
        description={`Last updated ${formatDate(page.updatedAt)}`}
        breadcrumbs={[{ name: page.title, path: `/legal/${slug}` }]}
        tone="light"
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_15rem]">
          <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
          <nav aria-label="Legal pages" className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-display text-sm font-semibold">Legal</p>
            <ul className="mt-3 space-y-1">
              {legalNav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={l.href === `/legal/${slug}` ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm",
                      l.href === `/legal/${slug}` ? "bg-ink-100 font-semibold text-ink-900" : "text-ink-600 hover:bg-ink-50",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </>
  );
}
