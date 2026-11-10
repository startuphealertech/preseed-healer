"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  APPLICATION_STATUSES,
  CONTACT_SUBJECT_LABELS,
  INVESTOR_TYPE_LABELS,
  LEAD_STATUSES,
  STARTUP_STAGE_LABELS,
  TICKET_SIZE_LABELS,
  type Paginated,
} from "@preseedhealer/types";
import { api } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApiData } from "./hooks";
import { AdminHeader, adminInput, btn, ConfirmButton, ErrorBox, LoadingRows, Panel, Pill, Toast } from "./ui";

type Detail = { label: string; render: (d: any) => ReactNode };
type Kind = {
  key: string;
  title: string;
  singular: string;
  endpoint: string;
  statuses: readonly string[];
  /** messages use read/unread instead of a status field */
  statusField: "status" | "read";
  exportable: boolean;
  columns: { label: string; render: (d: any) => ReactNode; className?: string }[];
  details: { section: string; rows: Detail[] }[];
  replyTo?: (d: any) => { email: string; subject: string };
};

const link = (url: string) =>
  url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 underline">
      {url}
    </a>
  ) : (
    "—"
  );
const mail = (e: string) => (
  <a href={`mailto:${e}`} className="text-brand-700 underline">
    {e}
  </a>
);
const tel = (p: string) => (p ? <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="text-brand-700 underline">{p}</a> : "—");
const text = (v: unknown) => (v === "" || v == null ? "—" : String(v));

export const kinds: Record<string, Kind> = {
  applications: {
    key: "applications",
    title: "Applications",
    singular: "Application",
    endpoint: "/admin/applications",
    statuses: APPLICATION_STATUSES,
    statusField: "status",
    exportable: true,
    columns: [
      { label: "Startup", render: (d) => <span className="font-semibold text-ink-900">{d.startupName}</span> },
      { label: "Founder", render: (d) => d.founderName, className: "hidden sm:table-cell" },
      { label: "Sector", render: (d) => d.sector, className: "hidden lg:table-cell" },
      { label: "Ref", render: (d) => <code className="text-xs">{d.refCode}</code>, className: "hidden md:table-cell" },
      { label: "Status", render: (d) => <Pill value={d.status} /> },
      { label: "Received", render: (d) => formatDateTime(d.createdAt), className: "hidden md:table-cell" },
    ],
    details: [
      {
        section: "Startup",
        rows: [
          { label: "Name", render: (d) => d.startupName },
          { label: "One-liner", render: (d) => d.oneLiner },
          { label: "Description", render: (d) => <span className="whitespace-pre-line">{d.description}</span> },
          { label: "Sector", render: (d) => d.sector },
          { label: "Stage", render: (d) => STARTUP_STAGE_LABELS[d.stage as keyof typeof STARTUP_STAGE_LABELS] ?? d.stage },
          { label: "Founded", render: (d) => d.foundedYear },
          { label: "Team size", render: (d) => d.teamSize },
          { label: "DPIIT recognised", render: (d) => (d.dpiitRecognised ? "Yes" : "No") },
          { label: "Website", render: (d) => link(d.website) },
        ],
      },
      {
        section: "Fundraising",
        rows: [
          { label: "Raising", render: (d) => d.fundingAsk },
          { label: "Raised so far", render: (d) => text(d.raisedSoFar) },
          { label: "Monthly revenue", render: (d) => text(d.monthlyRevenue) },
          { label: "Pitch deck", render: (d) => link(d.pitchDeckUrl) },
          { label: "Phase", render: (d) => d.phase },
          { label: "Heard from", render: (d) => text(d.heardFrom) },
        ],
      },
      {
        section: "Founder",
        rows: [
          { label: "Name", render: (d) => d.founderName },
          { label: "Email", render: (d) => mail(d.email) },
          { label: "Phone", render: (d) => tel(d.phone) },
          { label: "City", render: (d) => d.city },
          { label: "LinkedIn", render: (d) => link(d.linkedin) },
        ],
      },
    ],
    replyTo: (d) => ({ email: d.email, subject: `Your PreSeedHealer application (${d.refCode})` }),
  },

  investors: {
    key: "investors",
    title: "Investor leads",
    singular: "Investor lead",
    endpoint: "/admin/investor-interests",
    statuses: LEAD_STATUSES,
    statusField: "status",
    exportable: true,
    columns: [
      { label: "Name", render: (d) => <span className="font-semibold text-ink-900">{d.name}</span> },
      { label: "Organisation", render: (d) => text(d.organization), className: "hidden sm:table-cell" },
      { label: "Type", render: (d) => INVESTOR_TYPE_LABELS[d.investorType as keyof typeof INVESTOR_TYPE_LABELS], className: "hidden lg:table-cell" },
      { label: "Ticket", render: (d) => TICKET_SIZE_LABELS[d.ticketSize as keyof typeof TICKET_SIZE_LABELS] ?? d.ticketSize, className: "hidden md:table-cell" },
      { label: "Status", render: (d) => <Pill value={d.status} /> },
      { label: "Received", render: (d) => formatDateTime(d.createdAt), className: "hidden md:table-cell" },
    ],
    details: [
      {
        section: "Investor",
        rows: [
          { label: "Name", render: (d) => d.name },
          { label: "Organisation", render: (d) => text(d.organization) },
          { label: "Type", render: (d) => INVESTOR_TYPE_LABELS[d.investorType as keyof typeof INVESTOR_TYPE_LABELS] },
          { label: "Cheque size", render: (d) => TICKET_SIZE_LABELS[d.ticketSize as keyof typeof TICKET_SIZE_LABELS] ?? d.ticketSize },
          { label: "Sectors", render: (d) => d.sectors.join(", ") },
          { label: "Message", render: (d) => <span className="whitespace-pre-line">{text(d.message)}</span> },
        ],
      },
      {
        section: "Contact",
        rows: [
          { label: "Email", render: (d) => mail(d.email) },
          { label: "Phone", render: (d) => tel(d.phone) },
          { label: "LinkedIn", render: (d) => link(d.linkedin) },
        ],
      },
    ],
    replyTo: (d) => ({ email: d.email, subject: "PreSeedHealer investor network" }),
  },

  messages: {
    key: "messages",
    title: "Messages",
    singular: "Message",
    endpoint: "/admin/messages",
    statuses: ["unread", "read"],
    statusField: "read",
    exportable: false,
    columns: [
      { label: "From", render: (d) => <span className={cn("text-ink-900", !d.read && "font-semibold")}>{d.name}</span> },
      { label: "Subject", render: (d) => CONTACT_SUBJECT_LABELS[d.subject as keyof typeof CONTACT_SUBJECT_LABELS], className: "hidden sm:table-cell" },
      { label: "Message", render: (d) => <span className="line-clamp-1 max-w-xs">{d.message}</span>, className: "hidden lg:table-cell" },
      { label: "Status", render: (d) => <Pill value={d.read ? "read" : "unread"} /> },
      { label: "Received", render: (d) => formatDateTime(d.createdAt), className: "hidden md:table-cell" },
    ],
    details: [
      {
        section: "Message",
        rows: [
          { label: "Subject", render: (d) => CONTACT_SUBJECT_LABELS[d.subject as keyof typeof CONTACT_SUBJECT_LABELS] },
          { label: "Message", render: (d) => <span className="whitespace-pre-line">{d.message}</span> },
        ],
      },
      {
        section: "Sender",
        rows: [
          { label: "Name", render: (d) => d.name },
          { label: "Email", render: (d) => mail(d.email) },
          { label: "Phone", render: (d) => tel(d.phone) },
        ],
      },
    ],
    replyTo: (d) => ({ email: d.email, subject: `Re: your message to PreSeedHealer` }),
  },
};

export function SubmissionList({ kindKey }: { kindKey: string }) {
  const kind = kinds[kindKey]!;
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const qs = new URLSearchParams({ page: String(page), ...(status ? { status } : {}), ...(query ? { q: query } : {}) });
  const { data, error, loading, reload } = useApiData<Paginated<any>>(`${kind.endpoint}?${qs}`);

  return (
    <>
      <AdminHeader
        title={kind.title}
        description={data ? `${data.total} ${data.total === 1 ? "entry" : "entries"}` : undefined}
        actions={
          kind.exportable && (
            <a href={`/api/v1${kind.endpoint}/export.csv`} className={btn.secondary}>
              Export CSV
            </a>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="sub-q" className="sr-only">
          Search
        </label>
        <input id="sub-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email…" className={`${adminInput} sm:max-w-xs`} />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by status">
          {["", ...kind.statuses].map((s) => (
            <button
              key={s || "all"}
              type="button"
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn(
                "min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium capitalize",
                status === s ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading && !data ? (
          <LoadingRows />
        ) : !data || data.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-500">Nothing here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                <tr>
                  {kind.columns.map((c) => (
                    <th key={c.label} scope="col" className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((d) => (
                  <tr key={d.id} className="relative hover:bg-ink-50/60">
                    {kind.columns.map((c, i) => (
                      <td key={c.label} className={`px-4 py-3 text-ink-700 ${c.className ?? ""}`}>
                        {i === 0 ? (
                          <Link href={`/admin/${kind.key}/${d.id}`} className="after:absolute after:inset-0">
                            {c.render(d)}
                          </Link>
                        ) : (
                          c.render(d)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" className={btn.secondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span className="text-ink-500">
            Page {data.page} of {data.pages}
          </span>
          <button type="button" className={btn.secondary} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export function SubmissionDetail({ kindKey, id }: { kindKey: string; id: string }) {
  const kind = kinds[kindKey]!;
  const router = useRouter();
  const { data, setData, error, loading } = useApiData<any>(`${kind.endpoint}/${id}`);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setNotes(data.notes ?? "");
    // Opening a message marks it read.
    if (kind.statusField === "read" && !data.read) {
      api<any>(`${kind.endpoint}/${id}`, { method: "PATCH", body: { read: true } }).then(setData).catch(() => {});
    }
  }, [data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setSaving(true);
    try {
      setData(await api<any>(`${kind.endpoint}/${id}`, { method: "PATCH", body }));
      setToast(msg);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <LoadingRows />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const title = data.startupName ?? data.name;
  const reply = kind.replyTo?.(data);

  return (
    <>
      <AdminHeader
        title={title}
        description={`${data.refCode ? `${data.refCode} · ` : ""}Received ${formatDateTime(data.createdAt)}`}
        back={{ href: `/admin/${kind.key}`, label: kind.title }}
        actions={
          reply && (
            <a href={`mailto:${reply.email}?subject=${encodeURIComponent(reply.subject)}`} className={btn.primary}>
              Reply by email
            </a>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {kind.details.map((s) => (
            <Panel key={s.section} title={s.section}>
              <dl className="divide-y divide-ink-100">
                {s.rows.map((r) => (
                  <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-ink-500">{r.label}</dt>
                    <dd className="text-sm text-ink-900">{r.render(data)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          ))}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Status">
            {kind.statusField === "status" ? (
              <div className="grid grid-cols-2 gap-2">
                {kind.statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    aria-pressed={data.status === s}
                    onClick={() => patch({ status: s }, `Marked as ${s}`)}
                    className={cn(
                      "min-h-10 rounded-lg text-sm font-semibold capitalize",
                      data.status === s ? "bg-ink-900 text-white" : "border border-ink-200 hover:bg-ink-50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button type="button" className={btn.secondary} onClick={() => patch({ read: !data.read }, data.read ? "Marked unread" : "Marked read")}>
                Mark as {data.read ? "unread" : "read"}
              </button>
            )}
          </Panel>

          {kind.statusField === "status" && (
            <Panel title="Internal notes">
              <label htmlFor="notes" className="sr-only">
                Internal notes
              </label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} className={cn(adminInput, "min-h-32")} placeholder="Visible to admins only" />
              <button type="button" className={cn(btn.primary, "mt-3 w-full")} disabled={saving || notes === (data.notes ?? "")} onClick={() => patch({ notes }, "Notes saved")}>
                Save notes
              </button>
            </Panel>
          )}

          <ConfirmButton
            className="w-full"
            onConfirm={async () => {
              await api(`${kind.endpoint}/${id}`, { method: "DELETE" });
              router.replace(`/admin/${kind.key}`);
            }}
          >
            Delete {kind.singular.toLowerCase()}
          </ConfirmButton>
        </div>
      </div>
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}

