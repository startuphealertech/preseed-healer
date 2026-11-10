import "server-only";
import { cache } from "react";
import type {
  Category,
  Faq,
  Page,
  PageRef,
  Paginated,
  Partner,
  PostSummary,
  PostWithRelated,
} from "@preseedhealer/types";
import { apiGet, orNull, withBuildFallback } from "./api";

export const POSTS_PER_PAGE = 9;

export type PostList = Paginated<PostSummary> & { category: Category | null };

const emptyList = (page: number): PostList => ({ items: [], page, limit: POSTS_PER_PAGE, total: 0, pages: 1, category: null });

export const getPosts = cache(
  async (opts: { page?: number; category?: string; q?: string; limit?: number } = {}): Promise<PostList> => {
    const page = opts.page ?? 1;
    const qs = new URLSearchParams({ page: String(page), limit: String(opts.limit ?? POSTS_PER_PAGE) });
    if (opts.category) qs.set("category", opts.category);
    if (opts.q) qs.set("q", opts.q);
    return withBuildFallback(
      apiGet<PostList>(`/posts?${qs}`, { tags: ["posts"], revalidate: opts.q ? 60 : 600 }),
      emptyList(page),
      "posts",
    );
  },
);

export const getPost = cache(async (slug: string) =>
  orNull(apiGet<PostWithRelated>(`/posts/${encodeURIComponent(slug)}`, { tags: ["posts", `post:${slug}`] })),
);

export async function getPostSitemap() {
  return withBuildFallback(
    apiGet<{ slug: string; updatedAt: string }[]>("/posts/sitemap", { tags: ["posts"] }),
    [],
    "post sitemap",
  );
}

export const getCategories = cache(async () =>
  withBuildFallback(apiGet<Category[]>("/categories", { tags: ["posts", "categories"] }), [], "categories"),
);

export const getPartners = cache(async (placement?: "investors" | "partners") =>
  withBuildFallback(
    apiGet<Partner[]>(`/partners${placement ? `?placement=${placement}` : ""}`, { tags: ["partners"] }),
    [],
    "partners",
  ),
);

export const getFaqs = cache(async () => withBuildFallback(apiGet<Faq[]>("/faqs", { tags: ["faqs"] }), [], "faqs"));

export const getPage = cache(async (slug: string) =>
  orNull(apiGet<Page>(`/pages/${encodeURIComponent(slug)}`, { tags: ["pages", `page:${slug}`] })),
);

export async function getPages() {
  return withBuildFallback(apiGet<PageRef[]>("/pages", { tags: ["pages"] }), [], "pages");
}

/** Groups FAQs by their `group` field, preserving API order. */
export function groupFaqs(faqs: Faq[]) {
  const groups = new Map<string, Faq[]>();
  for (const f of faqs) groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}
