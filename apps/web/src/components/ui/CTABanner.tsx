import type { ReactNode } from "react";
import { Container } from "./Container";

/** Full-width closing call-to-action band. */
export function CTABanner({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions: ReactNode }) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-accent-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-h2 font-semibold">{title}</h2>
              {description && <p className="mt-4 text-lead text-ink-300">{description}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">{actions}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
