"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const cls = "inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-medium text-ink-700 hover:border-ink-300 hover:bg-ink-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-ink-900">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
          {l.label}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
      <button type="button" onClick={copy} className={cls}>
        <Icon name={copied ? "check" : "link"} className="size-4" />
        <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
