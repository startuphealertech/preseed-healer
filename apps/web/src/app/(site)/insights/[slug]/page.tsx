import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { PostGrid } from "@/components/content/PostCard";
import { ShareButtons } from "@/components/content/ShareButtons";
import { JsonLd } from "@/components/seo/JsonLd";
import { AccordionItem } from "@/components/ui/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SmartImage } from "@/components/ui/SmartImage";
import { getPost, getPostSitemap } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, articleJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPostSitemap();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: "Article not found", robots: { index: false } };
  const { post } = data;
  return buildMetadata({
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt,
    path: `/insights/${post.slug}`,
    image: post.seo.ogImage || post.coverImage || undefined,
    type: "article",
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const { post, related } = data;
  const { html, toc } = renderMarkdown(post.content);
  const path = `/insights/${post.slug}`;
  const crumbs = [
    { name: "Insights", path: "/insights" },
    ...(post.category ? [{ name: post.category.name, path: `/insights/category/${post.category.slug}` }] : []),
    { name: post.title, path },
  ];

  return (
    <>
      <article>
        <header className="bg-ink-50">
          <Container size="narrow" className="py-10 sm:py-14">
            <Breadcrumbs items={crumbs} tone="light" />
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              {post.category && (
                <Link href={`/insights/category/${post.category.slug}`} className="font-semibold tracking-wide text-brand-600 uppercase hover:underline">
                  {post.category.name}
                </Link>
              )}
              {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-4 text-h1 font-bold">{post.title}</h1>
            {post.excerpt && <p className="mt-5 text-lead text-ink-600">{post.excerpt}</p>}
            {post.author && <p className="mt-5 text-sm font-medium text-ink-700">By {post.author}</p>}
          </Container>
        </header>

        {post.coverImage && (
          <Container size="narrow" className="-mt-2 pt-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100">
              <SmartImage src={post.coverImage} alt={post.coverAlt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
            </div>
          </Container>
        )}

        <Container className="py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_16rem]">
            <div className="min-w-0">
              {toc.length >= 3 && (
                <details className="mb-8 rounded-2xl border border-ink-100 bg-ink-50 p-5 lg:hidden">
                  <summary className="font-display font-semibold">On this page</summary>
                  <TocList toc={toc} />
                </details>
              )}
              <div className="article" dangerouslySetInnerHTML={{ __html: html }} />

              {post.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="mt-14">
                  <h2 id="faq-heading" className="font-display text-h3 font-semibold">
                    Frequently asked questions
                  </h2>
                  <div className="card mt-5 px-5 sm:px-7">
                    {post.faqs.map((f) => (
                      <AccordionItem key={f.question} question={f.question}>
                        {f.answer}
                      </AccordionItem>
                    ))}
                  </div>
                </section>
              )}

              {post.tags.length > 0 && (
                <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map((t) => (
                    <li key={t} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700">
                      #{t}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-10 border-t border-ink-100 pt-6">
                <ShareButtons url={absoluteUrl(path)} title={post.title} />
              </div>

              <aside className="mt-10 rounded-2xl bg-ink-900 p-7 text-white sm:p-9">
                <h2 className="font-display text-xl font-semibold">About {siteConfig.name}</h2>
                <p className="mt-3 text-ink-300">
                  {siteConfig.name} connects early-stage Indian startups with investors and ecosystem partners through a
                  curated, phase-based programme.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button href={siteConfig.applyHref} arrow>
                    Apply for Phase 01
                  </Button>
                  <Button href="/about" variant="outline-light">
                    Learn more
                  </Button>
                </div>
              </aside>
            </div>

            {toc.length >= 3 && (
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <p className="font-display text-sm font-semibold">On this page</p>
                  <TocList toc={toc} />
                </div>
              </aside>
            )}
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="bg-ink-50 py-14 sm:py-20" aria-labelledby="related-heading">
          <Container>
            <h2 id="related-heading" className="text-h2 font-semibold">
              Keep reading
            </h2>
            <PostGrid posts={related} className="mt-8" />
          </Container>
        </section>
      )}

      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.seo.description || post.excerpt,
          path,
          image: post.seo.ogImage || post.coverImage || undefined,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.author,
          section: post.category?.name,
        })}
      />
      {post.faqs.length > 0 && <JsonLd data={faqJsonLd(post.faqs)} />}
    </>
  );
}

function TocList({ toc }: { toc: { id: string; text: string; level: 2 | 3 }[] }) {
  return (
    <ul className="mt-3 space-y-1 border-l border-ink-200 text-sm">
      {toc.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            className={`-ml-px block border-l border-transparent py-1.5 text-ink-600 hover:border-ink-900 hover:text-ink-900 ${t.level === 3 ? "pl-7" : "pl-4"}`}
          >
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  );
}
