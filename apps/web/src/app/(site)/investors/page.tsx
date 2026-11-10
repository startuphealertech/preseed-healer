import { siteConfig } from "@/config/site";
import { FeatureCard } from "@/components/content/FeatureCard";
import { PartnerCard } from "@/components/content/PartnerCard";
import { PartnerDirectory } from "@/components/content/PartnerDirectory";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getPartners } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "For Investors: Discover Pre-Seed Startups in India",
  description:
    "Meet curated, investment-ready Indian startups. Angel investors, VCs, family offices and corporates can join PreSeedHealer's capital network.",
  path: "/investors",
});

const benefits = [
  { icon: "target" as const, title: "Curated deal flow", body: "Startups are screened for problem, team, traction and readiness before they reach you." },
  { icon: "layers" as const, title: "Sector-matched", body: "Tell us your thesis and ticket size; we prioritise founders that fit." },
  { icon: "users" as const, title: "Co-investor network", body: "Meet fellow angels, funds and family offices active in early-stage India." },
];

export default async function InvestorsPage() {
  const partners = await getPartners("investors");
  const cards = Object.fromEntries(partners.map((p) => [p.id, <PartnerCard key={p.id} partner={p} />]));

  return (
    <>
      <PageHero
        eyebrow="Invest · Connect · Collaborate · Grow"
        title="For investors & capital partners."
        description="Discover high-potential founders and build meaningful investment conversations with India's next generation of startups."
        breadcrumbs={[{ name: "Investors", path: "/investors" }]}
        actions={
          <>
            <Button href={siteConfig.investorJoinHref} size="lg" arrow>
              Join as an investor
            </Button>
            <Button href="#network" size="lg" variant="outline-light">
              See the network
            </Button>
          </>
        }
      />

      <Section>
        <SectionHeader eyebrow="Why join" title="Early access to founders worth meeting." />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title}>
              <FeatureCard icon={b.icon} title={b.title}>
                {b.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" id="network">
        <SectionHeader
          eyebrow="Capital & ecosystem network"
          title="Participating capital & ecosystem partners"
          description="Angels, funds, family offices, corporates and institutions working with PreSeedHealer."
        />
        <div className="mt-10">
          <PartnerDirectory partners={partners} cards={cards} />
        </div>
      </Section>

      <CTABanner
        title="Looking for your next investment?"
        description="Share your thesis and ticket size, and we'll reach out with relevant founders."
        actions={
          <Button href={siteConfig.investorJoinHref} size="lg" arrow>
            Join as an investor
          </Button>
        }
      />
    </>
  );
}
