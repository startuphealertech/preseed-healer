import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Phase 02: Pitch & Investor Sessions",
  description: "Phase 02 of PreSeedHealer Summit 2026 brings selected startups face to face with investors. Details will be announced soon.",
  path: "/phase-02",
});

export default async function Phase02Page() {
  const { phases } = await getSettings();
  return (
    <>
      <PageHero
        eyebrow={`${siteConfig.event.shortName} · Phase 02`}
        title="Something bigger is taking shape."
        description="Phase 02 is where selected founders meet investors. Programme details will be released once officially confirmed."
        breadcrumbs={[
          { name: siteConfig.event.shortName, path: siteConfig.event.href },
          { name: "Phase 02", path: "/phase-02" },
        ]}
        actions={
          <>
            <Button href={siteConfig.event.href} size="lg" variant="outline-light">
              Back to {siteConfig.event.shortName}
            </Button>
            {phases.phase01.status === "open" && (
              <Button href={siteConfig.applyHref} size="lg" arrow>
                Apply to Phase 01 first
              </Button>
            )}
          </>
        }
      />
      <Section containerSize="narrow">
        <div className="card p-7 text-center sm:p-10">
          <p className="text-xs font-semibold tracking-[0.16em] text-accent-700 uppercase">{phases.phase02.label}</p>
          <h2 className="mt-3 text-h3 font-semibold">How to get into Phase 02</h2>
          <p className="mt-3 text-ink-600">
            Only startups shortlisted from Phase 01 move forward. Apply now and keep an eye on your inbox and our Insights page
            for announcements.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/insights" variant="outline">
              Read updates
            </Button>
            <Button href="/faq" variant="ghost">
              FAQ
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
