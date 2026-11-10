import Link from "next/link";
import type { PostSummary } from "@preseedhealer/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Cover image or a branded gradient placeholder with the category name. */
function Cover({ post, priority }: { post: PostSummary; priority?: boolean }) {
  if (post.coverImage) {
    return (
      <SmartImage
        src={post.coverImage}
        alt={post.coverAlt || ""}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700 p-6">
      <span className="text-center font-display text-lg font-semibold text-white/90">{post.category?.name ?? "Insights"}</span>
    </div>
  );
}

export function PostCard({ post, priority, headingLevel = "h3" }: { post: PostSummary; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group card card-hover relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-ink-100">
        <Cover post={post} priority={priority} />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-500">
          {post.category && <span className="font-semibold tracking-wide text-brand-600 uppercase">{post.category.name}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          <span>{post.readingMinutes} min read</span>
        </div>
        <H className="mt-3 font-display text-lg leading-snug font-semibold text-ink-900">
          {/* Stretched link: the whole card is clickable, with one accessible link. */}
          <Link href={`/insights/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {post.title}
          </Link>
        </H>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">{post.excerpt}</p>}
        <span className="mt-auto pt-4 text-sm font-semibold text-ink-900" aria-hidden="true">
          Read more →
        </span>
      </div>
    </article>
  );
}

export function PostGrid({ posts, className, firstPriority }: { posts: PostSummary[]; className?: string; firstPriority?: boolean }) {
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {posts.map((p, i) => (
        <li key={p.id}>
          <PostCard post={p} priority={firstPriority && i === 0} />
        </li>
      ))}
    </ul>
  );
}
