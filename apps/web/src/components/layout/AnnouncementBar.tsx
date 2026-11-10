import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function AnnouncementBar() {
  const { announcement } = await getSettings();
  if (!announcement.enabled || !announcement.text) return null;

  const inner = (
    <>
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-500 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-success-500" />
      </span>
      <span className="truncate">{announcement.text}</span>
      {announcement.href && <span aria-hidden="true" className="hidden sm:inline">→</span>}
    </>
  );

  const cls =
    "flex min-h-9 items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium tracking-wide uppercase sm:text-[0.8rem]";

  return (
    <div className="bg-ink-950 text-ink-100" role="region" aria-label="Announcement">
      {announcement.href ? (
        <Link href={announcement.href} className={`${cls} hover:text-white`}>
          {inner}
        </Link>
      ) : (
        <p className={cls}>{inner}</p>
      )}
    </div>
  );
}
