import type { Metadata } from "next";
import { NotFoundContent } from "@/components/content/NotFoundContent";
import { SiteChrome } from "@/components/layout/SiteChrome";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Unmatched URLs: rendered under the bare root layout, so it brings its own site chrome. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
