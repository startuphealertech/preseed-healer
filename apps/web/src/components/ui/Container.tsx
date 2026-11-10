import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = {
  as?: T;
  size?: "default" | "narrow" | "wide";
} & ComponentPropsWithoutRef<T>;

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
};

/** Centered content column with the site-wide side gutter (16px mobile → 32px desktop). */
export function Container<T extends ElementType = "div">({
  as,
  size = "default",
  className,
  ...props
}: Props<T>) {
  const Tag = as ?? "div";
  return <Tag className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)} {...props} />;
}
