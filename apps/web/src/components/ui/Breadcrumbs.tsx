import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/cn";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail + BreadcrumbList structured data. "Home" is prepended automatically. */
export function Breadcrumbs({ items, tone = "dark", className }: { items: Crumb[]; tone?: "dark" | "light"; className?: string }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  const dark = tone === "dark";
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", dark ? "text-ink-300" : "text-ink-500")}>
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className={cn("line-clamp-1", dark ? "text-white" : "text-ink-900")}>
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className={cn("hover:underline", dark ? "hover:text-white" : "hover:text-ink-900")}>
                      {c.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
