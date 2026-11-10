import { PartnerCard } from "@/components/content/PartnerCard";
import { PartnerDirectory } from "@/components/content/PartnerDirectory";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/ui/CTABanner";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getPartners } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Partners",
  description:
    "Meet PreSeedHealer's ecosystem partners: investors, incubators, accelerators, mentors and institutions supporting Indian startups.",
  path: "/partners",
});

export default async function PartnersPage() {
  const partners = await getPartners("partners");
  const cards = Object.fromEntries(partners.map((p) => [p.id, <PartnerCard key={p.id} partner={p} />]));

  return (
    <>
      <PageHero
        eyebrow="Partners"
        title="Built with the ecosystem."
        description="PreSeedHealer works alongside investors, incubators, institutions and mentors who share one goal: helping great Indian startups get funded."
        breadcrumbs={[{ name: "Partners", path: "/partners" }]}
      />
      <Section>
        <SectionHeader eyebrow="Our ecosystem" title="Partners & collaborators" />
        <div className="mt-10">
          <PartnerDirectory partners={partners} cards={cards} />
        </div>
      </Section>
      <CTABanner
        title="Want to partner with PreSeedHealer?"
        description="Incubators, communities, institutions and service providers: let's build together."
        actions={
          <Button href="/contact?subject=partnership" size="lg" arrow>
            Become a partner
          </Button>
        }
      />
    </>
  );
}
