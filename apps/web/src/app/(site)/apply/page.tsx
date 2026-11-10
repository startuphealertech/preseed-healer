import Link from "next/link";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Apply for Phase 01",
  description:
    "Apply to PreSeedHealer Phase 01. Share your startup and fundraising details in a 10-minute form to get in front of investors.",
  path: "/apply",
});

const tips = [
  "Keep your pitch deck link ready and set to “anyone with the link can view”.",
  "Be specific: numbers beat adjectives.",
  "One application per startup per phase.",
];

export default async function ApplyPage() {
  const { phases } = await getSettings();
  const open = phases.phase01.status === "open";

  return (
    <>
      <PageHero
        eyebrow="Phase 01 application"
        title="Apply to PreSeedHealer"
        description="Tell us about you, your startup and your fundraise. Every application is reviewed by our team."
        breadcrumbs={[{ name: "Apply", path: "/apply" }]}
      />
      <Container className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_18rem]">
          <div className="min-w-0">
            {open ? (
              <ApplicationForm />
            ) : (
              <div className="card p-8 text-center sm:p-12">
                <h2 className="text-h3 font-semibold">Applications are currently closed</h2>
                <p className="mt-3 text-ink-600">{phases.phase01.label}. Follow Insights for the next window.</p>
                <Button href="/insights" className="mt-6" arrow>
                  Read updates
                </Button>
              </div>
            )}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-ink-50 p-6">
              <h2 className="font-display font-semibold">Before you start</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-700">
                {tips.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-ink-100 p-6 text-sm text-ink-600">
              <p>
                Questions? Read the{" "}
                <Link href="/faq" className="font-medium text-brand-600 underline">
                  FAQ
                </Link>{" "}
                or{" "}
                <Link href="/contact?subject=startup" className="font-medium text-brand-600 underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
