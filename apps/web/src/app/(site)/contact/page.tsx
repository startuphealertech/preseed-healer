import Link from "next/link";
import { ContactForm } from "@/components/forms/ContactForm";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with PreSeedHealer about applications, investor participation, partnerships or media.",
  path: "/contact",
});

type Props = { searchParams: Promise<{ subject?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ contact, social }, { subject }] = await Promise.all([getSettings(), searchParams]);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk."
        description="Questions about applying, investing or partnering? Send us a message and we'll get back within two working days."
        breadcrumbs={[{ name: "Contact", path: "/contact" }]}
      />
      <Container className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_20rem]">
          <ContactForm defaultSubject={subject} />
          <aside className="space-y-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="card flex items-center gap-4 p-5 hover:border-ink-200">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="mail" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-ink-500 uppercase">Email</span>
                  <span className="font-medium break-all">{contact.email}</span>
                </span>
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="card flex items-center gap-4 p-5 hover:border-ink-200">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="phone" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-ink-500 uppercase">Phone</span>
                  <span className="font-medium">{contact.phone}</span>
                </span>
              </a>
            )}
            {social.whatsapp && (
              <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 hover:border-ink-200">
                <span className="grid size-11 place-items-center rounded-xl bg-success-50 text-success-700">
                  <Icon name="users" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-ink-500 uppercase">Community</span>
                  <span className="font-medium">Join our WhatsApp community</span>
                </span>
              </a>
            )}
            <div className="rounded-2xl bg-ink-50 p-5 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">Looking for something specific?</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/apply" className="text-brand-700 underline">Apply as a startup</Link>
                </li>
                <li>
                  <Link href="/investors/join" className="text-brand-700 underline">Join as an investor</Link>
                </li>
                <li>
                  <Link href="/faq" className="text-brand-700 underline">Read the FAQ</Link>
                </li>
                <li>
                  <Link href="/legal/contact-grievance" className="text-brand-700 underline">Grievance officer</Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
