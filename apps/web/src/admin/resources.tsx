import type { ReactNode } from "react";
import type { ZodType } from "zod";
import {
  CategoryInputSchema,
  FaqInputSchema,
  PageInputSchema,
  PARTNER_TYPE_LABELS,
  PARTNER_TYPES,
  PartnerInputSchema,
  PostInputSchema,
} from "@preseedhealer/types";
import { formatDate } from "@/lib/format";
import { isoToLocalInput } from "./hooks";
import { Pill } from "./ui";

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "select"
  | "checkbox"
  | "number"
  | "image"
  | "tags"
  | "datetime"
  | "faqs"
  | "url";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  section: string;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Load options from an admin endpoint (e.g. categories). */
  optionsFrom?: { endpoint: string; label: string; value: string; empty?: string };
  maxLength?: number;
  wide?: boolean;
};

export type Column = { label: string; render: (item: any) => ReactNode; className?: string };

export type ResourceConfig = {
  key: string;
  title: string;
  singular: string;
  endpoint: string;
  schema: ZodType<any, any>;
  columns: Column[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  /** API item → form values. */
  toForm?: (item: any) => Record<string, unknown>;
  /** Public URL to preview the item on the site. */
  viewHref?: (item: any) => string | null;
  searchKeys: string[];
};

const yesNo = (b: boolean) => <Pill value={b ? "yes" : "no"} />;

export const resources: Record<string, ResourceConfig> = {
  posts: {
    key: "posts",
    title: "Insights",
    singular: "Article",
    endpoint: "/admin/posts",
    schema: PostInputSchema,
    searchKeys: ["title", "slug"],
    columns: [
      { label: "Title", render: (p) => <span className="font-semibold text-ink-900">{p.title}</span> },
      { label: "Status", render: (p) => <Pill value={p.status} /> },
      { label: "Category", render: (p) => p.category?.name ?? "—", className: "hidden md:table-cell" },
      { label: "Published", render: (p) => formatDate(p.publishedAt) || "—", className: "hidden sm:table-cell" },
    ],
    defaults: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      coverAlt: "",
      category: "",
      tags: [],
      author: "",
      status: "draft",
      publishedAt: "",
      seo: { title: "", description: "", ogImage: "" },
      faqs: [],
    },
    toForm: (p) => ({ ...p, category: p.category?.id ?? "", publishedAt: isoToLocalInput(p.publishedAt) }),
    viewHref: (p) => (p.status === "published" ? `/insights/${p.slug}` : null),
    fields: [
      { section: "Article", name: "title", label: "Title", type: "text", required: true, maxLength: 160, wide: true },
      { section: "Article", name: "slug", label: "URL slug", type: "text", help: "Leave empty to generate from the title. Changing it changes the URL.", wide: true },
      { section: "Article", name: "excerpt", label: "Excerpt", type: "textarea", maxLength: 320, help: "Shown on cards and used as the meta description if SEO description is empty.", wide: true },
      { section: "Article", name: "content", label: "Content", type: "markdown", wide: true },
      { section: "Publishing", name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }] },
      { section: "Publishing", name: "publishedAt", label: "Publish date", type: "datetime", help: "Empty = now when publishing. Future dates schedule the post." },
      { section: "Publishing", name: "category", label: "Category", type: "select", optionsFrom: { endpoint: "/admin/categories", label: "name", value: "id", empty: "No category" } },
      { section: "Publishing", name: "author", label: "Author", type: "text", maxLength: 80 },
      { section: "Publishing", name: "tags", label: "Tags", type: "tags", wide: true },
      { section: "Media", name: "coverImage", label: "Cover image", type: "image", help: "16:9, at least 1200×675.", wide: true },
      { section: "Media", name: "coverAlt", label: "Cover alt text", type: "text", maxLength: 200, help: "Describe the image for screen readers and SEO.", wide: true },
      { section: "SEO", name: "seo.title", label: "SEO title", type: "text", maxLength: 70, help: "Defaults to the article title. Keep under 60–70 characters.", wide: true },
      { section: "SEO", name: "seo.description", label: "Meta description", type: "textarea", maxLength: 170, help: "Defaults to the excerpt. 140–160 characters is ideal.", wide: true },
      { section: "SEO", name: "seo.ogImage", label: "Social share image", type: "image", help: "1200×630. Defaults to the cover image or an auto-generated card.", wide: true },
      { section: "FAQs", name: "faqs", label: "FAQs (adds FAQ rich results)", type: "faqs", wide: true },
    ],
  },

  categories: {
    key: "categories",
    title: "Categories",
    singular: "Category",
    endpoint: "/admin/categories",
    schema: CategoryInputSchema,
    searchKeys: ["name", "slug"],
    columns: [
      { label: "Name", render: (c) => <span className="font-semibold text-ink-900">{c.name}</span> },
      { label: "Slug", render: (c) => <code className="text-xs">{c.slug}</code>, className: "hidden sm:table-cell" },
      { label: "Published posts", render: (c) => c.postCount ?? 0 },
    ],
    defaults: { name: "", slug: "", description: "" },
    viewHref: (c) => `/insights/category/${c.slug}`,
    fields: [
      { section: "Category", name: "name", label: "Name", type: "text", required: true, maxLength: 60, wide: true },
      { section: "Category", name: "slug", label: "URL slug", type: "text", help: "Leave empty to generate from the name.", wide: true },
      { section: "Category", name: "description", label: "Description", type: "textarea", maxLength: 300, help: "Shown on the category page and used for SEO.", wide: true },
    ],
  },

  partners: {
    key: "partners",
    title: "Partners & investors",
    singular: "Partner",
    endpoint: "/admin/partners",
    schema: PartnerInputSchema,
    searchKeys: ["name", "organization", "role"],
    columns: [
      { label: "Name", render: (p) => <span className="font-semibold text-ink-900">{p.name}</span> },
      { label: "Type", render: (p) => PARTNER_TYPE_LABELS[p.type as keyof typeof PARTNER_TYPE_LABELS], className: "hidden md:table-cell" },
      { label: "Investors page", render: (p) => yesNo(p.showOnInvestors), className: "hidden lg:table-cell" },
      { label: "Partners page", render: (p) => yesNo(p.showOnPartners), className: "hidden lg:table-cell" },
      { label: "Live", render: (p) => yesNo(p.published) },
    ],
    defaults: {
      name: "",
      organization: "",
      role: "",
      type: "angel",
      description: "",
      image: "",
      website: "",
      showOnInvestors: true,
      showOnPartners: true,
      order: 0,
      published: true,
    },
    viewHref: () => "/partners",
    fields: [
      { section: "Profile", name: "name", label: "Name", type: "text", required: true, maxLength: 100 },
      { section: "Profile", name: "organization", label: "Organisation", type: "text", maxLength: 120 },
      { section: "Profile", name: "type", label: "Category", type: "select", options: PARTNER_TYPES.map((t) => ({ value: t, label: PARTNER_TYPE_LABELS[t] })) },
      { section: "Profile", name: "role", label: "Role label", type: "text", maxLength: 120, help: "e.g. “Angel Investor Partner”. Defaults to the category." },
      { section: "Profile", name: "description", label: "Short bio", type: "textarea", maxLength: 600, wide: true },
      { section: "Profile", name: "image", label: "Photo / logo", type: "image", help: "Square, at least 256×256.", wide: true },
      { section: "Profile", name: "website", label: "Website", type: "url", wide: true },
      { section: "Display", name: "showOnInvestors", label: "Show on Investors page", type: "checkbox" },
      { section: "Display", name: "showOnPartners", label: "Show on Partners page", type: "checkbox" },
      { section: "Display", name: "published", label: "Published", type: "checkbox" },
      { section: "Display", name: "order", label: "Sort order", type: "number", help: "Lower numbers appear first." },
    ],
  },

  faqs: {
    key: "faqs",
    title: "FAQs",
    singular: "FAQ",
    endpoint: "/admin/faqs",
    schema: FaqInputSchema,
    searchKeys: ["question", "group"],
    columns: [
      { label: "Question", render: (f) => <span className="font-semibold text-ink-900">{f.question}</span> },
      { label: "Group", render: (f) => f.group, className: "hidden sm:table-cell" },
      { label: "Order", render: (f) => f.order, className: "hidden md:table-cell" },
      { label: "Live", render: (f) => yesNo(f.published) },
    ],
    defaults: { question: "", answer: "", group: "General", order: 0, published: true },
    viewHref: () => "/faq",
    fields: [
      { section: "FAQ", name: "question", label: "Question", type: "text", required: true, maxLength: 300, wide: true },
      { section: "FAQ", name: "answer", label: "Answer", type: "textarea", required: true, maxLength: 3000, wide: true },
      { section: "FAQ", name: "group", label: "Group", type: "text", maxLength: 60, help: "FAQs are grouped by this label (e.g. Applying, Selection)." },
      { section: "FAQ", name: "order", label: "Order within group", type: "number" },
      { section: "FAQ", name: "published", label: "Published", type: "checkbox" },
    ],
  },

  pages: {
    key: "pages",
    title: "Legal pages",
    singular: "Page",
    endpoint: "/admin/pages",
    schema: PageInputSchema,
    searchKeys: ["title", "slug"],
    columns: [
      { label: "Title", render: (p) => <span className="font-semibold text-ink-900">{p.title}</span> },
      { label: "URL", render: (p) => <code className="text-xs">/legal/{p.slug}</code>, className: "hidden sm:table-cell" },
      { label: "Updated", render: (p) => formatDate(p.updatedAt), className: "hidden md:table-cell" },
      { label: "Live", render: (p) => yesNo(p.published) },
    ],
    defaults: { title: "", slug: "", content: "", seo: { title: "", description: "", ogImage: "" }, published: true },
    viewHref: (p) => `/legal/${p.slug}`,
    fields: [
      { section: "Page", name: "title", label: "Title", type: "text", required: true, maxLength: 120, wide: true },
      { section: "Page", name: "slug", label: "URL slug", type: "text", required: true, help: "Page is served at /legal/<slug>. Footer links use the default slugs.", wide: true },
      { section: "Page", name: "content", label: "Content", type: "markdown", wide: true },
      { section: "Page", name: "published", label: "Published", type: "checkbox" },
      { section: "SEO", name: "seo.title", label: "SEO title", type: "text", maxLength: 70, wide: true },
      { section: "SEO", name: "seo.description", label: "Meta description", type: "textarea", maxLength: 170, wide: true },
    ],
  },
};
