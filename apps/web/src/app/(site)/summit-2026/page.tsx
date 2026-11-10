import { siteConfig } from "@/config/site";
import { FeatureCard } from "@/components/content/FeatureCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { PhaseBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { buildMetadata, eventJsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

const description =
  "PreSeedHealer Summit 2026 brings together founders, investors and ecosystem stakeholders in a two-phase programme culminating in focused investor sessions.";

export const metadata = buildMetadata({ title: siteConfig.event.name, description, path: siteConfig.event.href });

const experience = [
  { icon: "mic" as const, title: "Founder pitches", body: "Shortlisted startups present to investors in a focused, time-boxed format." },
  { icon: "users" as const, title: "Investor roundtables", body: "Small-group conversations between founders and active early-stage investors." },
  { icon: "network" as const, title: "Ecosystem connects", body: "Meet incubators, mentors, institutions and service partners in one place." },
];

export default async function SummitPage() {
  const { phases } = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Ideas today · A brighter tomorrow"
        title={`${siteConfig.event.name}.`}
        description={description}
        breadcrumbs={[{ name: siteConfig.event.shortName, path: siteConfig.event.href }]}
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply for Phase 01
            </Button>
            <Button href="/investors/join" size="lg" variant="outline-light">
              Attend as investor
            </Button>
          </>
        }
      />

      <Section>
        <SectionHeader eyebrow="Programme journey" title="Two phases. One larger vision." />
        <ol className="relative mt-12 grid gap-6 md:grid-cols-2">
          {[
            { phase: "Phase 01", href: "/phase-01", status: phases.phase01.status, label: phases.phase01.label, title: "Applications & discovery", body: "Founders apply online and are reviewed for investor readiness." },
            { phase: "Phase 02", href: "/phase-02", status: phases.phase02.status, label: phases.phase02.label, title: "Pitch & investor sessions", body: "Selected startups meet investors at the flagship experience." },
          ].map((p) => (
            <li key={p.phase} className="card p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-ink-400 uppercase">{p.phase}</span>
                <PhaseBadge status={p.status} />
              </div>
              <h3 className="mt-5 text-h3 font-semibold">{p.title}</h3>
              <p className="mt-2 text-ink-600">{p.body}</p>
              <p className="mt-3 text-sm font-medium text-ink-500">{p.label}</p>
              <Button href={p.href} variant="outline" arrow className="mt-6">
                Explore {p.phase}
              </Button>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="dark">
        <SectionHeader
          tone="dark"
          eyebrow="Flagship experience"
          title="What to expect"
          description="Final dates, venue and agenda will be published here and on Insights once confirmed."
        />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {experience.map((e) => (
            <li key={e.title}>
              <FeatureCard tone="dark" icon={e.icon} title={e.title}>
                {e.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <CTABanner
        title="Secure your startup's spot."
        description="Phase 01 is the only way in. Applications are reviewed on a rolling basis."
        actions={
          <Button href={siteConfig.applyHref} size="lg" arrow>
            Apply now
          </Button>
        }
      />

      {/* Event schema without dates is still valid for discovery; add startDate/location once announced. */}
      <JsonLd data={eventJsonLd({ name: siteConfig.event.name, description, path: siteConfig.event.href })} />
    </>
  );
}
