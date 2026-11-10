import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSettings } from "@/lib/settings";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Public-site frame: skip link, announcement bar, header, footer, global JSON-LD, consented analytics. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const { social } = await getSettings();
  const sameAs = Object.values(social).filter(Boolean);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <JsonLd data={[organizationJsonLd(sameAs), websiteJsonLd()]} />
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? ""} />
    </>
  );
}
