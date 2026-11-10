import { siteConfig } from "@/config/site";
import { FeatureCard } from "@/components/content/FeatureCard";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "PreSeedHealer is a curated platform built to bring Indian founders closer to capital: connecting startups, investors and ecosystem partners.",
  path: "/about",
});

const pillars = [
  { icon: "link" as const, label: "Purpose", title: "Connect", body: "Bring founders, investors and ecosystem partners together in focused, meaningful settings." },
  { icon: "sparkles" as const, label: "Approach", title: "Enable", body: "Help founders become investment-ready with structure, feedback and visibility." },
  { icon: "trendingUp" as const, label: "Focus", title: "Fund", body: "Create real capital conversations between promising startups and the right investors." },
  { icon: "rocket" as const, label: "Vision", title: "Scale", body: "Support ventures beyond the first cheque with a network that helps them grow." },
];

const values = [
  { title: "Curation over volume", body: "We'd rather introduce ten well-matched startups than a hundred random ones. Investors' time is precious, and so is yours." },
  { title: "Transparent process", body: "Clear phases, clear criteria and a reference number for every application. Updates are published openly on Insights." },
  { title: "Founder-first", body: "Founders retain ownership of everything they submit. We exist to open doors, not to take a cut of your ambition." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About PreSeedHealer"
        title="A platform built to bring founders closer to capital."
        description="Raising a first round in India is still too dependent on who you know. PreSeedHealer creates a structured, curated path from a promising idea to a real investor conversation."
        breadcrumbs={[{ name: "About", path: "/about" }]}
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply for Phase 01
            </Button>
            <Button href="/investors" size="lg" variant="outline-light">
              For investors
            </Button>
          </>
        }
      />

      <Section>
        <SectionHeader eyebrow="What we do" title="Four pillars, one mission." />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <li key={p.title}>
              <FeatureCard icon={p.icon} index={p.label} title={p.title}>
                {p.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="dark">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader tone="dark" eyebrow="How we work" title="Principles we hold ourselves to." />
          <ol className="space-y-8">
            {values.map((v, i) => (
              <li key={v.title} className="flex gap-5">
                <span className="font-display text-2xl font-bold text-accent-400">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{v.title}</h3>
                  <p className="mt-2 text-ink-300">{v.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <CTABanner
        title="Be part of what's next."
        description="Whether you're building, investing or supporting founders, there's a place for you at PreSeedHealer."
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply as a startup
            </Button>
            <Button href="/contact" size="lg" variant="outline-light">
              Partner with us
            </Button>
          </>
        }
      />
    </>
  );
}
