import Link from "next/link";
import { slugify } from "@preseedhealer/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getFaqs, groupFaqs } from "@/lib/content";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about applying to PreSeedHealer, selection, investors and partnerships.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = groupFaqs(faqs);

  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="Frequently asked questions"
        description="Everything founders, investors and partners usually ask us. Can't find your answer? Get in touch."
        breadcrumbs={[{ name: "FAQ", path: "/faq" }]}
        tone="light"
      />
      <Section containerSize="default">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_1fr]">
          {groups.length > 1 && (
            <nav aria-label="FAQ topics" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
                {groups.map((g) => (
                  <li key={g.group}>
                    <a
                      href={`#${slugify(g.group)}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-ink-200 px-4 text-sm font-medium whitespace-nowrap text-ink-700 hover:bg-ink-50 lg:w-full lg:rounded-xl lg:border-0"
                    >
                      {g.group}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="space-y-12">
            {groups.length === 0 && <p className="text-ink-600">FAQs will appear here soon.</p>}
            {groups.map((g) => (
              <section key={g.group} id={slugify(g.group)} aria-labelledby={`h-${slugify(g.group)}`}>
                <h2 id={`h-${slugify(g.group)}`} className="font-display text-xl font-semibold">
                  {g.group}
                </h2>
                <div className="card mt-4 px-5 sm:px-7">
                  {g.items.map((f) => (
                    <AccordionItem key={f.id} question={f.question}>
                      {f.answer}
                    </AccordionItem>
                  ))}
                </div>
              </section>
            ))}

            <div className="rounded-2xl bg-ink-50 p-7">
              <h2 className="font-display text-lg font-semibold">Still have a question?</h2>
              <p className="mt-2 text-ink-600">
                Write to us and we&apos;ll get back within two working days. Official updates are always on{" "}
                <Link href="/insights" className="font-medium text-brand-600 underline">
                  Insights
                </Link>
                .
              </p>
              <Button href="/contact" arrow className="mt-5">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </Section>
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
    </>
  );
}
