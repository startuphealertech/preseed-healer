import Link from "next/link";
import { siteConfig } from "@/config/site";
import { PhaseBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Phase 01: Startup Applications",
  description: "PreSeedHealer Phase 01 applications are open. Learn what you need, how to apply and what happens after you submit.",
  path: "/phase-01",
});

const checklist = [
  "Founder name, email, phone and city",
  "Startup name, sector, stage, founding year and team size",
  "A one-line description and a short overview",
  "How much you've raised and how much you're raising",
  "A shareable pitch deck link (Google Drive, DocSend, etc.)",
];

export default async function Phase01Page() {
  const { phases } = await getSettings();
  const open = phases.phase01.status === "open";

  return (
    <>
      <PageHero
        eyebrow={`${siteConfig.event.shortName} · Phase 01`}
        title={open ? "Applications are open." : "Applications are currently closed."}
        description="Phase 01 is the entry point to PreSeedHealer. Applications are submitted through our official online form and reviewed by the team."
        breadcrumbs={[
          { name: siteConfig.event.shortName, path: siteConfig.event.href },
          { name: "Phase 01", path: "/phase-01" },
        ]}
        actions={
          open ? (
            <Button href={siteConfig.applyHref} size="lg" arrow>
              Start application
            </Button>
          ) : (
            <Button href="/insights" size="lg" variant="outline-light">
              Follow updates
            </Button>
          )
        }
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="card p-7">
            <p className="text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">Status</p>
            <div className="mt-3">
              <PhaseBadge status={phases.phase01.status} />
            </div>
            <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">Application window</p>
            <p className="mt-2 font-display text-xl font-semibold">{phases.phase01.label}</p>
            <p className="mt-4 text-sm text-ink-600">
              Official updates are published on{" "}
              <Link href="/insights" className="font-medium text-brand-600 underline">
                Insights
              </Link>
              .
            </p>
          </div>

          <div className="card p-7 lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">What you&apos;ll need</h2>
            <ul className="mt-5 space-y-3">
              {checklist.map((c) => (
                <li key={c} className="flex gap-3 text-ink-700">
                  <Icon name="check" className="mt-0.5 size-5 shrink-0 text-success-500" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-500">
              The form takes about 10 minutes. You&apos;ll receive a reference number by email when you submit. Please read
              the{" "}
              <Link href="/legal/application-selection" className="font-medium text-brand-600 underline">
                Application &amp; Selection terms
              </Link>{" "}
              before applying.
            </p>
            {open && (
              <Button href={siteConfig.applyHref} arrow className="mt-6">
                Apply online
              </Button>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
