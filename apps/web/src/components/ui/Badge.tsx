import type { ReactNode } from "react";
import type { PhaseStatus } from "@preseedhealer/types";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "accent" | "success" | "danger" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-100 text-accent-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
  dark: "bg-white/10 text-white",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

const phaseTone: Record<PhaseStatus, Tone> = { open: "success", closed: "neutral", "coming-soon": "accent" };
const phaseLabel: Record<PhaseStatus, string> = { open: "Open", closed: "Closed", "coming-soon": "Coming soon" };

export function PhaseBadge({ status, dark }: { status: PhaseStatus; dark?: boolean }) {
  return (
    <Badge tone={dark && status !== "open" ? "dark" : phaseTone[status]}>
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", status === "open" ? "bg-success-500" : status === "coming-soon" ? "bg-accent-500" : "bg-ink-400")}
      />
      {phaseLabel[status]}
    </Badge>
  );
}
