import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Section";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  tone?: "dark" | "light";
  children?: ReactNode;
  className?: string;
};

/** Top-of-page hero for inner pages. Owns the page's single <h1>. */
export function PageHero({ eyebrow, title, description, actions, breadcrumbs, tone = "dark", children, className }: Props) {
  const dark = tone === "dark";
  return (
    <section className={cn("relative overflow-hidden", dark ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-900", className)}>
      {dark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-15%] size-[28rem] rounded-full bg-brand-600/25 blur-3xl sm:size-[36rem]" />
          <div className="absolute -bottom-40 left-[-10%] size-[22rem] rounded-full bg-accent-500/10 blur-3xl" />
        </div>
      )}
      <Container className="relative py-14 sm:py-20 lg:py-24">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} tone={tone} className="mb-6" />}
        {eyebrow && <Eyebrow tone={dark ? "dark" : "light"}>{eyebrow}</Eyebrow>}
        <h1 className="mt-3 max-w-4xl text-h1 font-bold">{title}</h1>
        {description && <p className={cn("mt-5 max-w-2xl text-lead", dark ? "text-ink-300" : "text-ink-600")}>{description}</p>}
        {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>}
        {children}
      </Container>
    </section>
  );
}
