import type { SiteSettings } from "@preseedhealer/types";
import { PhaseBadge } from "@/components/ui/Badge";

/** "Programme status" card used in the home hero and Phase pages. */
export function StatusPanel({ phases }: { phases: SiteSettings["phases"] }) {
  const rows = [
    { label: "Applications", value: phases.phase01.status === "open" ? "Open" : "Closed" },
    { label: "Phase 01", value: <PhaseBadge status={phases.phase01.status} dark /> },
    { label: "Application window", value: phases.phase01.label },
    { label: "Phase 02", value: <PhaseBadge status={phases.phase02.status} dark /> },
  ];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-400 uppercase">Programme status</p>
      <dl className="mt-5 divide-y divide-white/10">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-3.5">
            <dt className="text-sm text-ink-300">{r.label}</dt>
            <dd className="text-right text-sm font-semibold text-white">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
