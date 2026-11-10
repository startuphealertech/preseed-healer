import { InvestorForm } from "@/components/forms/InvestorForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Join as an Investor",
  description: "Angel investors, VCs, family offices and corporates: join PreSeedHealer's network to meet curated early-stage Indian startups.",
  path: "/investors/join",
});

export default function InvestorJoinPage() {
  return (
    <>
      <PageHero
        eyebrow="For investors"
        title="Join the investor network"
        description="Tell us what you invest in. We'll reach out with relevant, pre-screened founders."
        breadcrumbs={[
          { name: "Investors", path: "/investors" },
          { name: "Join", path: "/investors/join" },
        ]}
      />
      <Container size="narrow" className="py-10 sm:py-14">
        <InvestorForm />
      </Container>
    </>
  );
}
