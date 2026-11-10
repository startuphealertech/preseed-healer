"use client";

import Link from "next/link";
import type { DashboardStats } from "@preseedhealer/types";
import { formatDateTime } from "@/lib/format";
import { useAdminUser } from "./AdminShell";
import { useApiData } from "./hooks";
import { AdminHeader, btn, ErrorBox, LoadingRows, Panel, Pill } from "./ui";

function Stat({ label, value, sub, href }: { label: string; value: number; sub?: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-ink-200 bg-white p-5 transition-colors hover:border-ink-300">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-brand-700">{sub}</p>}
    </Link>
  );
}

export function Dashboard() {
  const user = useAdminUser();
  const { data, error, loading, reload } = useApiData<DashboardStats>("/admin/dashboard");
  const isAdmin = user?.role === "admin";

  return (
    <>
      <AdminHeader
        title={`Welcome, ${user?.name ?? ""}`}
        description="Here's what's happening on PreSeedHealer."
        actions={
          <Link href="/admin/posts/new" className={btn.primary}>
            + New article
          </Link>
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? (
        <LoadingRows />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {isAdmin && data.applications && <Stat label="Applications" value={data.applications.total} sub={`${data.applications.new} new · ${data.applications.shortlisted} shortlisted`} href="/admin/applications" />}
              {isAdmin && data.investors && <Stat label="Investor leads" value={data.investors.total} sub={`${data.investors.new} new`} href="/admin/investors" />}
              {isAdmin && data.messages && <Stat label="Messages" value={data.messages.total} sub={`${data.messages.unread} unread`} href="/admin/messages" />}
              <Stat label="Published articles" value={data.posts.published} sub={`${data.posts.drafts} drafts`} href="/admin/posts" />
              {!isAdmin && <Stat label="Partners" value={data.partners} href="/admin/partners" />}
            </div>

            {isAdmin && data.recentApplications && (
              <Panel
                title="Recent applications"
                className="mt-6"
                actions={
                  <Link href="/admin/applications" className="text-xs font-semibold text-brand-700 hover:underline">
                    View all
                  </Link>
                }
              >
                {data.recentApplications.length === 0 ? (
                  <p className="text-sm text-ink-500">No applications yet. Share the /apply link to get started.</p>
                ) : (
                  <ul className="-my-3 divide-y divide-ink-100">
                    {data.recentApplications.map((a) => (
                      <li key={a.id}>
                        <Link href={`/admin/applications/${a.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-ink-50/60">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{a.startupName}</span>
                            <span className="block truncate text-xs text-ink-500">
                              {a.founderName} · {a.sector} · {formatDateTime(a.createdAt)}
                            </span>
                          </span>
                          <Pill value={a.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { href: "/admin/settings", label: "Update announcement bar & phases" },
                { href: "/admin/partners/new", label: "Add a partner or investor" },
                { href: "/admin/faqs/new", label: "Add an FAQ" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="rounded-xl border border-dashed border-ink-300 p-4 text-sm font-semibold text-ink-700 hover:border-ink-400 hover:bg-white">
                  {l.label} →
                </Link>
              ))}
            </div>
          </>
        )
      )}
    </>
  );
}
