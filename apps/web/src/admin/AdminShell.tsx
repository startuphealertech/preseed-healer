"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminUser } from "@preseedhealer/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { useApiData } from "./hooks";

const UserContext = createContext<AdminUser | null>(null);
export const useAdminUser = () => useContext(UserContext);

type NavItem = { href: string; label: string; icon: IconName; adminOnly?: boolean };
const nav: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "layers" }] },
  {
    title: "Submissions",
    items: [
      { href: "/admin/applications", label: "Applications", icon: "rocket", adminOnly: true },
      { href: "/admin/investors", label: "Investor leads", icon: "briefcase", adminOnly: true },
      { href: "/admin/messages", label: "Messages", icon: "mail", adminOnly: true },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/posts", label: "Insights", icon: "file" },
      { href: "/admin/categories", label: "Categories", icon: "layers" },
      { href: "/admin/partners", label: "Partners", icon: "users" },
      { href: "/admin/faqs", label: "FAQs", icon: "search" },
      { href: "/admin/pages", label: "Legal pages", icon: "shield" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "sparkles" },
      { href: "/admin/account", label: "Account", icon: "target" },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: user, error } = useApiData<AdminUser>("/auth/me");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  };

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-semibold">Couldn&apos;t load the admin panel.</p>
          <p className="mt-1 text-sm text-ink-500">{error}</p>
          <Link href="/admin/login" className="mt-4 inline-block font-semibold text-brand-700 underline">
            Sign in again
          </Link>
        </div>
      </div>
    );
  }
  if (!user) {
    return <div className="grid min-h-dvh place-items-center text-sm text-ink-500">Loading…</div>;
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <Link href="/admin" className="flex min-h-16 items-center gap-2 px-5 font-display text-lg font-bold text-white">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-500 text-ink-900">P</span>
        PreSeedHealer
      </Link>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {nav.map((g) => {
          const items = g.items.filter((i) => !i.adminOnly || user.role === "admin");
          if (!items.length) return null;
          return (
            <div key={g.title} className="mt-5">
              <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-ink-400 uppercase">{g.title}</p>
              <ul className="mt-1.5 space-y-0.5">
                {items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={isActive(i.href) ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                        isActive(i.href) ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon name={i.icon} className="size-4" />
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-ink-400">
          {user.email} · {user.role}
        </p>
        <div className="mt-3 flex gap-2">
          <Link href="/" target="_blank" className="flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-semibold text-ink-200 hover:bg-white/5">
            View site
          </Link>
          <button type="button" onClick={logout} className="flex-1 rounded-lg border border-white/15 py-2 text-xs font-semibold text-ink-200 hover:bg-white/5">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-dvh bg-ink-50 lg:pl-64">
        <aside className="fixed inset-y-0 left-0 hidden w-64 bg-ink-950 lg:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-ink-200 bg-white px-4 pt-[env(safe-area-inset-top,0px)] lg:hidden">
          <Link href="/admin" className="font-display font-bold">
            PreSeedHealer Admin
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-lg hover:bg-ink-100" aria-label="Open menu" aria-expanded={open}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} aria-hidden="true" />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-in bg-ink-950">{sidebar}</aside>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </UserContext.Provider>
  );
}
