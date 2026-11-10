import type { Metadata } from "next";
import { NotFoundContent } from "@/components/content/NotFoundContent";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** notFound() inside public pages: rendered within (site)/layout, so the site chrome isn't duplicated. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
