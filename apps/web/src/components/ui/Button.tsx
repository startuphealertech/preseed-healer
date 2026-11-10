import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "outline-light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors " +
  "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-accent-500 text-ink-900 hover:bg-accent-400 focus-visible:outline-accent-500",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900",
  outline: "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50",
  "outline-light": "border border-white/25 text-white hover:bg-white/10",
  ghost: "text-ink-700 hover:bg-ink-100",
};

// Every size keeps a ≥44px tap target on touch devices.
const sizes: Record<Size, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-11 px-5 text-sm sm:text-base",
  lg: "min-h-12 px-6 text-base sm:min-h-14 sm:px-8",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode; arrow?: boolean };

type AsLink = Common & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">;
type AsButton = Common & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className">;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", className, children, arrow, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkProps } = rest as AsLink;
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as AsButton;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
