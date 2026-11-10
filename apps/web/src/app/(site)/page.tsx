import Link from "next/link";
import { siteConfig } from "@/config/site";
import { FeatureCard } from "@/components/content/FeatureCard";
import { PostGrid } from "@/components/content/PostCard";
import { StatusPanel } from "@/components/content/StatusPanel";
import { PhaseBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { getPartners, getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: { absolute: `${siteConfig.name}: Pre-Seed Startup Fundraising Platform in India` },
  description: siteConfig.description,
  path: "/",
});

const pillars = [
  { n: "01", label: "Founders" },
  { n: "02", label: "Investors" },
  { n: "03", label: "Opportunity" },
  { n: "04", label: "Growth" },
];

const why: { icon: IconName; title: string; body: string }[] = [
  { icon: "search", title: "Founder discovery", body: "A structured way for promising early-stage startups to get noticed by people who write cheques." },
  { icon: "users", title: "Investor connect", body: "Curated introductions to angels, funds and family offices aligned with your sector and stage." },
  { icon: "mic", title: "Pitch opportunity", body: "Shortlisted founders progress to pitch formats designed for focused, high-quality conversations." },
  { icon: "eye", title: "Strategic visibility", body: "Get your story in front of investors, partners and media across the startup ecosystem." },
  { icon: "shield", title: "Capital readiness", body: "Guidance on decks, metrics and positioning so you walk into investor meetings prepared." },
  { icon: "network", title: "Ecosystem network", body: "Access to incubators, mentors and institutional partners that support you beyond the raise." },
];

export default async function HomePage() {
  const [{ phases }, latest, partners] = await Promise.all([
    getSettings(),
    getPosts({ limit: 3 }).catch(() => null),
    getPartners("partners").catch(() => []),
  ]);
  const applicationsOpen = phases.phase01.status === "open";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-20%] size-[36rem] rounded-full bg-brand-600/30 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[-10%] size-[28rem] rounded-full bg-accent-500/10 blur-3xl" />
        </div>
        <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:py-32">
          <div>
            <Eyebrow tone="dark">
              Phase 01 · {applicationsOpen ? "Applications open" : phases.phase01.label}
            </Eyebrow>
            <h1 className="mt-4 text-display font-bold">
              Where founders <span className="text-accent-400">meet capital.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lead text-ink-300">
              PreSeedHealer is a curated platform that brings early-stage Indian startups, investors and ecosystem partners
              into the same room, so great ideas get the capital and support they need to grow.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href={siteConfig.applyHref} size="lg" arrow>
                Apply for Phase 01
              </Button>
              <Button href="/about" size="lg" variant="outline-light">
                Explore PreSeedHealer
              </Button>
            </div>
          </div>
          <StatusPanel phases={phases} />
        </Container>

        {/* Pillar strip */}
        <div className="relative border-t border-white/10">
          <Container>
            <ul className="grid grid-cols-2 sm:grid-cols-4">
              {pillars.map((p, i) => (
                <li
                  key={p.n}
                  className={`flex items-baseline gap-3 py-5 sm:py-6 ${i % 2 ? "pl-4 sm:pl-6" : ""} ${i > 0 ? "sm:border-l sm:border-white/10 sm:pl-6" : ""}`}
                >
                  <span className="font-display text-sm text-ink-400">{p.n}</span>
                  <span className="font-display text-base font-semibold sm:text-lg">{p.label}</span>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* Platform */}
      <Section>
        <SectionHeader
          eyebrow="The platform"
          title="More than an event. A fundraising ecosystem."
          description="PreSeedHealer is built for both sides of the table, with a clear path for founders raising their first round and investors looking for their next opportunity."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              href: "/startups",
              icon: "rocket" as const,
              title: "For startups",
              body: "Get discovered, pitch to relevant investors and build relationships that outlast a single round.",
              cta: "Explore startups",
            },
            {
              href: "/investors",
              icon: "briefcase" as const,
              title: "For investors",
              body: "Meet curated, investment-ready founders across sectors, and shape the next wave of Indian startups.",
              cta: "Explore investors",
            },
          ].map((c) => (
            <article key={c.href} className="group card card-hover relative flex flex-col p-7 sm:p-9">
              <span className="grid size-12 place-items-center rounded-xl bg-accent-100 text-accent-700">
                <Icon name={c.icon} className="size-6" />
              </span>
              <h3 className="mt-6 text-h3 font-semibold">
                <Link href={c.href} className="after:absolute after:inset-0">
                  {c.title}
                </Link>
              </h3>
              <p className="mt-3 text-ink-600">{c.body}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-ink-900 group-hover:text-brand-700" aria-hidden="true">
                {c.cta} <Icon name="arrowRight" className="size-4" />
              </span>
            </article>
          ))}
        </div>
      </Section>

      {/* Why */}
      <Section tone="muted">
        <SectionHeader
          eyebrow="Why PreSeedHealer"
          title="Designed around the moments that matter."
          description="Every part of the programme exists to move a founder closer to a real investment conversation."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {why.map((w, i) => (
            <li key={w.title}>
              <FeatureCard icon={w.icon} index={String(i + 1).padStart(2, "0")} title={w.title}>
                {w.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      {/* Journey */}
      <Section>
        <SectionHeader eyebrow="The journey" title="The first chapter is open." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl bg-ink-900 p-7 text-white sm:p-9">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-ink-400">PHASE 01</span>
              <PhaseBadge status={phases.phase01.status} dark />
            </div>
            <h3 className="mt-6 text-h3 font-semibold">Applications &amp; discovery</h3>
            <p className="mt-3 text-ink-300">
              Founders apply online. Our team reviews every application and shortlists startups for investor exposure.
            </p>
            <p className="mt-4 text-sm font-medium text-accent-400">{phases.phase01.label}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={siteConfig.applyHref} arrow>
                Apply now
              </Button>
              <Button href="/phase-01" variant="outline-light">
                Phase 01 details
              </Button>
            </div>
          </article>
          <article className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 p-7 sm:p-9">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-ink-400">PHASE 02</span>
              <PhaseBadge status={phases.phase02.status} />
            </div>
            <h3 className="mt-6 text-h3 font-semibold">Pitch &amp; investor sessions</h3>
            <p className="mt-3 text-ink-600">
              Selected founders move into focused pitch formats and investor conversations. Details will be announced once
              confirmed.
            </p>
            <p className="mt-4 text-sm font-medium text-ink-500">{phases.phase02.label}</p>
            <Button href="/phase-02" variant="outline" className="mt-8">
              What to expect
            </Button>
          </article>
        </div>
      </Section>

      {/* Summit promo */}
      <section className="bg-white pb-4">
        <Container>
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-accent-400 to-accent-500 p-7 text-ink-900 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:p-14">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">{siteConfig.event.name}</p>
              <h2 className="mt-3 text-h2 font-bold">Ideas today. A brighter tomorrow.</h2>
              <p className="mt-4 max-w-xl text-ink-800">
                Our flagship gathering of founders, investors and ecosystem leaders. Dates and venue will be announced soon.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button href={siteConfig.event.href} variant="secondary" size="lg" arrow>
                Explore {siteConfig.event.shortName}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Latest insights */}
      {latest && latest.items.length > 0 && (
        <Section>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader eyebrow="Insights" title="Latest from PreSeedHealer" />
            <Button href="/insights" variant="outline" arrow className="self-start sm:self-auto">
              All insights
            </Button>
          </div>
          <PostGrid posts={latest.items} className="mt-10" />
        </Section>
      )}

      {/* Partners strip */}
      {partners.length > 0 && (
        <Section tone="muted" className="!py-14 sm:!py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <Eyebrow>Ecosystem</Eyebrow>
              <h2 className="mt-2 font-display text-2xl font-semibold">Built with the ecosystem</h2>
            </div>
            <ul className="flex flex-wrap gap-2 lg:max-w-2xl lg:justify-end">
              {partners.slice(0, 10).map((p) => (
                <li key={p.id} className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/partners" className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Meet all partners <Icon name="arrowRight" className="size-4" />
          </Link>
        </Section>
      )}

      <CTABanner
        title="Your startup could be the next one in the room."
        description="Phase 01 takes about 10 minutes. Keep your pitch deck link handy."
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply for Phase 01
            </Button>
            <Button href="/faq" size="lg" variant="outline-light">
              Read the FAQ
            </Button>
          </>
        }
      />
    </>
  );
}
