/**
 * Single source of truth for brand + navigation.
 * Swap names/copy here; nothing else in the codebase hard-codes the brand.
 */

export const siteConfig = {
  name: "PreSeedHealer",
  shortName: "PreSeedHealer",
  tagline: "Where founders meet capital.",
  description:
    "PreSeedHealer is a curated fundraising platform connecting high-potential Indian startups with angel investors, VCs, family offices and the wider startup ecosystem.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, ""),
  domain: "preseedhealer.com",
  locale: "en_IN",
  /** Shown in the footer as "Organised by …" when set. */
  organizer: "",
  applyHref: "/apply",
  investorJoinHref: "/investors/join",
  event: {
    name: "PreSeedHealer Summit 2026",
    shortName: "Summit 2026",
    href: "/summit-2026",
  },
} as const;

export type NavItem = { label: string; href: string; badge?: string };

export const mainNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Startups", href: "/startups" },
  { label: "Investors", href: "/investors" },
  { label: siteConfig.event.shortName, href: siteConfig.event.href },
  { label: "Insights", href: "/insights" },
  { label: "Partners", href: "/partners" },
];

export const legalNav: NavItem[] = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms & Conditions", href: "/legal/terms-and-conditions" },
  { label: "Refund & Cancellation", href: "/legal/refund-policy" },
  { label: "Disclaimer", href: "/legal/disclaimer" },
  { label: "Application & Selection", href: "/legal/application-selection" },
  { label: "Cookie Policy", href: "/legal/cookie-policy" },
  { label: "Intellectual Property", href: "/legal/intellectual-property" },
  { label: "Contact & Grievance", href: "/legal/contact-grievance" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Explore",
    items: [
      { label: "About", href: "/about" },
      { label: "For Startups", href: "/startups" },
      { label: "For Investors", href: "/investors" },
      { label: siteConfig.event.shortName, href: siteConfig.event.href },
    ],
  },
  {
    title: "Programme",
    items: [
      { label: "Phase 01", href: "/phase-01" },
      { label: "Phase 02", href: "/phase-02", badge: "Soon" },
      { label: "Apply", href: "/apply" },
      { label: "Insights", href: "/insights" },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Partners", href: "/partners" },
      { label: "Join as investor", href: "/investors/join" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  { title: "Legal", items: legalNav },
];
