import { mainNav, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    // No backdrop-filter here: it would become the containing block for the fixed mobile drawer.
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo className="relative z-50" />

        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={mainNav} />
        </nav>

        <div className="flex items-center gap-2">
          <Button href={siteConfig.applyHref} size="sm" arrow className="hidden sm:inline-flex">
            Apply now
          </Button>
          <MobileNav items={mainNav} applyHref={siteConfig.applyHref} />
        </div>
      </Container>
    </header>
  );
}
