import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export function NotFoundContent() {
  return (
    <Section containerSize="narrow" className="text-center">
      <p className="font-display text-6xl font-bold text-ink-200">404</p>
      <h1 className="mt-4 text-h2 font-semibold">This page isn&apos;t here.</h1>
      <p className="mt-4 text-lead text-ink-600">It may have moved, or the link may be outdated.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="/" arrow>
          Back to home
        </Button>
        <Button href="/insights" variant="outline">
          Read insights
        </Button>
      </div>
    </Section>
  );
}
