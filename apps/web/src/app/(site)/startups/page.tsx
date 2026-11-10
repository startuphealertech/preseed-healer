import { siteConfig } from "@/config/site";
import { FeatureCard } from "@/components/content/FeatureCard";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "For Startups: Raise Your Pre-Seed Round",
  description:
    "Apply to PreSeedHealer to get investor visibility, pitch opportunities and a strategic network for your pre-seed or seed fundraise in India.",
  path: "/startups",
});

const opportunities = [
  { icon: "eye" as const, title: "Investor visibility", body: "A focused environment where your startup is seen by investors actively looking for early-stage deals." },
  { icon: "mic" as const, title: "Pitch opportunity", body: "Selected ventures progress to pitch formats and investor sessions in later phases of the programme." },
  { icon: "network" as const, title: "Strategic network", body: "Connections with incubators, mentors and ecosystem partners that matter beyond capital." },
];

const steps = [
  { title: "Apply online", body: "Share your startup, team and fundraising details in a 10-minute form." },
  { title: "Get reviewed", body: "Our team evaluates problem, team, traction and investor readiness." },
  { title: "Get shortlisted", body: "Shortlisted founders are contacted by email for a short conversation." },
  { title: "Meet investors", body: "Selected startups are presented to relevant investors and partners." },
];

const lookFor = [
  "Indian startups from idea to early-revenue stage",
  "Actively planning a pre-seed, seed or angel round",
  "A clear problem with evidence that customers care",
  "A committed founding team",
  "A pitch deck you can share via link",
];

export default function StartupsPage() {
  return (
    <>
      <PageHero
        eyebrow="For startups"
        title="Your venture. Your story. Your fundraising opportunity."
        description="PreSeedHealer is a structured entry point for founders who want visibility, investor conversations and ecosystem support for their next round."
        breadcrumbs={[{ name: "Startups", path: "/startups" }]}
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply for Phase 01
            </Button>
            <Button href="/phase-01" size="lg" variant="outline-light">
              View Phase 01
            </Button>
          </>
        }
      />

      <Section>
        <SectionHeader eyebrow="Founder opportunities" title="Designed for serious fundraising journeys." />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {opportunities.map((o, i) => (
            <li key={o.title}>
              <FeatureCard icon={o.icon} index={String(i + 1).padStart(2, "0")} title={o.title}>
                {o.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="How it works" title="From application to investor conversation." />
            <ol className="mt-10 space-y-6">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 font-display text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-1 text-ink-600">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card self-start p-7 sm:p-9">
            <h2 className="font-display text-xl font-semibold">Who should apply</h2>
            <ul className="mt-6 space-y-4">
              {lookFor.map((l) => (
                <li key={l} className="flex gap-3 text-ink-700">
                  <Icon name="check" className="mt-0.5 size-5 shrink-0 text-success-500" />
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-500">
              DPIIT recognition and incorporation help but aren&apos;t required. Phase 01 is free to apply.
            </p>
            <Button href={siteConfig.applyHref} arrow className="mt-6 w-full sm:w-auto">
              Start application
            </Button>
          </div>
        </div>
      </Section>

      <CTABanner
        title="Ready to be in the room?"
        description="Applications for Phase 01 are open. It takes about 10 minutes."
        actions={
          <>
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Apply now
            </Button>
            <Button href="/insights/pre-seed-pitch-deck-guide" size="lg" variant="outline-light">
              Pitch deck guide
            </Button>
          </>
        }
      />
    </>
  );
}
