import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

export function FeatureCard({
  icon,
  index,
  title,
  children,
  tone = "light",
}: {
  icon?: IconName;
  index?: string;
  title: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("h-full rounded-2xl p-6 sm:p-7", dark ? "border border-white/10 bg-white/5" : "card")}>
      <div className="flex items-center justify-between">
        {icon && (
          <span className={cn("grid size-11 place-items-center rounded-xl", dark ? "bg-accent-500/15 text-accent-400" : "bg-brand-50 text-brand-600")}>
            <Icon name={icon} className="size-5" />
          </span>
        )}
        {index && <span className={cn("font-display text-sm font-semibold", dark ? "text-ink-400" : "text-ink-300")}>{index}</span>}
      </div>
      <h3 className={cn("mt-5 font-display text-lg font-semibold", dark ? "text-white" : "text-ink-900")}>{title}</h3>
      <p className={cn("mt-2 text-sm leading-relaxed sm:text-base", dark ? "text-ink-300" : "text-ink-600")}>{children}</p>
    </div>
  );
}
