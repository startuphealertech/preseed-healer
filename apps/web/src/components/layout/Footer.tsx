import Link from "next/link";
import type { SiteSettings } from "@preseedhealer/types";
import { footerNav, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { getSettings } from "@/lib/settings";

const socialLabels: Record<keyof SiteSettings["social"], string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

export async function Footer() {
  const { contact, social } = await getSettings();
  const socials = (Object.keys(socialLabels) as (keyof typeof socialLabels)[]).filter((k) => social[k]);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 pb-[env(safe-area-inset-bottom,0px)] text-ink-300">
      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-sm leading-relaxed">
              {siteConfig.tagline} Connecting promising Indian startups with investors and the wider ecosystem.
            </p>
            <Button href={siteConfig.applyHref} size="sm" arrow className="mt-6">
              Apply for Phase 01
            </Button>

            {(contact.email || contact.phone || contact.address) && (
              <address className="mt-8 space-y-2 text-sm not-italic">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-white">
                    <Icon name="mail" className="size-4" /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-white">
                    <Icon name="phone" className="size-4" /> {contact.phone}
                  </a>
                )}
                {contact.address && (
                  <p className="flex items-start gap-2">
                    <Icon name="mapPin" className="mt-0.5 size-4 shrink-0" /> {contact.address}
                  </p>
                )}
              </address>
            )}

            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media">
                {socials.map((k) => (
                  <li key={k}>
                    <a
                      href={social[k]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-medium hover:border-white/40 hover:text-white"
                    >
                      {socialLabels[k]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase">{group.title}</h2>
                <ul className="mt-4 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="inline-flex min-h-9 items-center gap-2 text-sm hover:text-white">
                        {item.label}
                        {item.badge && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium text-ink-200">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          {siteConfig.organizer ? <p>Organised by {siteConfig.organizer}</p> : <p>{siteConfig.domain}</p>}
        </div>
      </Container>
    </footer>
  );
}
