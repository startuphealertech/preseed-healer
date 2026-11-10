import type { Metadata } from "next";
import type { FaqItem } from "@preseedhealer/types";
import { siteConfig } from "@/config/site";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}

type PageSeo = {
  /**
   * Required on every page. A plain string gets the layout template ("About | PreSeedHealer");
   * `{ absolute }` bypasses it (used by the home page).
   * Always set explicitly: relying on the layout's `title.default` drops the <title>
   * on ISR-regenerated pages in Next 16.4.
   */
  title: string | { absolute: string };
  description?: string;
  /** Route path, e.g. "/about". Used for the canonical URL. */
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

/** Per-page metadata with canonical, Open Graph and Twitter tags filled in consistently. */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path,
  image,
  type = "website",
  noIndex = false,
  publishedTime,
  modifiedTime,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = typeof title === "string" ? title : title.absolute;
  const img = image ? absoluteUrl(image) : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: socialTitle,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      // Without an explicit image, the nearest file-based opengraph-image.tsx is used.
      ...(img ? { images: [{ url: img, width: 1200, height: 630, alt: socialTitle }] } : {}),
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(img ? { images: [img] } : {}),
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

/* ---------- JSON-LD builders ---------- */

const orgId = () => `${siteConfig.url}/#organization`;

export function organizationJsonLd(sameAs: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId(),
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    description: siteConfig.description,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "en-IN",
    publisher: { "@id": orgId() },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/insights/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(p: {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedAt: string | null;
  updatedAt: string;
  author?: string;
  section?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    mainEntityOfPage: absoluteUrl(p.path),
    image: [absoluteUrl(p.image || `${p.path}/opengraph-image`)],
    datePublished: p.publishedAt ?? p.updatedAt,
    dateModified: p.updatedAt,
    author: p.author
      ? { "@type": "Person", name: p.author }
      : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@id": orgId(), "@type": "Organization", name: siteConfig.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
    ...(p.section ? { articleSection: p.section } : {}),
    inLanguage: "en-IN",
  };
}

export function eventJsonLd(p: { name: string; description: string; path: string; startDate?: string; endDate?: string; location?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: p.name,
    description: p.description,
    url: absoluteUrl(p.path),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: { "@id": orgId(), "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    ...(p.startDate ? { startDate: p.startDate } : {}),
    ...(p.endDate ? { endDate: p.endDate } : {}),
    ...(p.location ? { location: { "@type": "Place", name: p.location, address: { "@type": "PostalAddress", addressCountry: "IN" } } } : {}),
  };
}
