import type { Partner } from "@preseedhealer/types";
import { PARTNER_TYPE_LABELS } from "@preseedhealer/types";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <article className="card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-100">
          {partner.image ? (
            <SmartImage src={partner.image} alt="" fill sizes="64px" className="object-contain p-1.5" />
          ) : (
            <span aria-hidden="true" className="grid size-full place-items-center bg-gradient-to-br from-brand-50 to-accent-50 font-display text-lg font-bold text-ink-700">
              {initials(partner.name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base leading-snug font-semibold text-ink-900">{partner.name}</h3>
          {partner.organization && <p className="truncate text-sm text-ink-600">{partner.organization}</p>}
          <p className="mt-1 text-xs font-semibold tracking-wide text-brand-600 uppercase">
            {partner.role || PARTNER_TYPE_LABELS[partner.type]}
          </p>
        </div>
      </div>
      {partner.description && <p className="mt-4 text-sm leading-relaxed text-ink-600">{partner.description}</p>}
      {partner.website && (
        <a
          href={partner.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-4 text-sm font-semibold text-ink-900 hover:text-brand-700"
        >
          Visit website <Icon name="arrowUpRight" className="size-4" />
          <span className="sr-only">(opens {partner.name} in a new tab)</span>
        </a>
      )}
    </article>
  );
}
