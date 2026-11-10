import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Native <details> accordion: zero JS, keyboard accessible, and the answer text is in the
 * HTML so search engines index it (and Chrome's find-in-page opens it).
 */
export function AccordionItem({ question, children, defaultOpen }: { question: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-ink-100 last:border-0" open={defaultOpen}>
      <summary className="flex min-h-14 items-center justify-between gap-4 py-4 text-left font-display text-base font-semibold text-ink-900 sm:text-lg">
        {question}
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-50 text-ink-600 transition-transform group-open:rotate-180">
          <Icon name="chevronDown" className="size-4" />
        </span>
      </summary>
      <div className="pb-5 pr-10 text-ink-600 leading-relaxed whitespace-pre-line">{children}</div>
    </details>
  );
}
