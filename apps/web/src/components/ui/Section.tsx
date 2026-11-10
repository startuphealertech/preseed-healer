import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type Tone = "light" | "muted" | "dark";

const tones: Record<Tone, string> = {
  light: "bg-white text-ink-900",
  muted: "bg-ink-50 text-ink-900",
  dark: "bg-ink-900 text-white",
};

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: Tone;
  containerSize?: "default" | "narrow" | "wide";
};

/** Vertical rhythm wrapper for every page section. */
export function Section({ tone = "light", containerSize, className, children, ...props }: SectionProps) {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-28", tones[tone], className)} {...props}>
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

type HeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Heading level; pages own the single <h1>, sections default to <h2>. */
  as?: "h1" | "h2";
  tone?: Tone;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  tone = "light",
  className,
}: HeaderProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Heading className={cn("mt-3 font-semibold", Heading === "h1" ? "text-display" : "text-h2")}>
        {title}
      </Heading>
      {description && (
        <p className={cn("mt-4 text-lead", dark ? "text-ink-300" : "text-ink-600")}>{description}</p>
      )}
    </div>
  );
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.18em] uppercase",
        tone === "dark" ? "text-accent-400" : "text-brand-600",
      )}
    >
      {children}
    </p>
  );
}
