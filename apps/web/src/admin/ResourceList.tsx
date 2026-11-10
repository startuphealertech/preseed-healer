"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApiData } from "./hooks";
import { resources } from "./resources";
import { AdminHeader, adminInput, btn, ErrorBox, LoadingRows } from "./ui";

/** Takes the resource key (not the config): configs contain render functions, which can't cross the server→client boundary. */
export function ResourceList({ resourceKey }: { resourceKey: string }) {
  const config = resources[resourceKey]!;
  // Posts return a paginated object; other resources return arrays.
  const path = config.key === "posts" ? `${config.endpoint}?limit=100` : config.endpoint;
  const { data, error, loading, reload } = useApiData<any[] | { items: any[]; total: number }>(path);
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const all = Array.isArray(data) ? data : (data?.items ?? []);
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((it) => config.searchKeys.some((k) => String(it[k] ?? "").toLowerCase().includes(needle)));
  }, [data, q, config.searchKeys]);

  const total = Array.isArray(data) ? data.length : (data?.total ?? 0);

  return (
    <>
      <AdminHeader
        title={config.title}
        description={data ? `${total} total` : undefined}
        actions={
          <Link href={`/admin/${config.key}/new`} className={btn.primary}>
            + New {config.singular.toLowerCase()}
          </Link>
        }
      />
      <div className="mb-4">
        <label htmlFor="res-search" className="sr-only">
          Search {config.title}
        </label>
        <input id="res-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className={`${adminInput} max-w-sm`} />
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading && !data ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-500">
            {q ? "No matches." : `No ${config.title.toLowerCase()} yet.`}{" "}
            {!q && (
              <Link href={`/admin/${config.key}/new`} className="font-semibold text-brand-700 underline">
                Create the first one
              </Link>
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                <tr>
                  {config.columns.map((c) => (
                    <th key={c.label} scope="col" className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((it) => {
                  const view = config.viewHref?.(it);
                  return (
                    <tr key={it.id} className="hover:bg-ink-50/60">
                      {config.columns.map((c, i) => (
                        <td key={c.label} className={`px-4 py-3 align-middle text-ink-700 ${c.className ?? ""}`}>
                          {i === 0 ? (
                            <Link href={`/admin/${config.key}/${it.id}`} className="hover:underline">
                              {c.render(it)}
                            </Link>
                          ) : (
                            c.render(it)
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {view && (
                          <a href={view} target="_blank" rel="noreferrer" className="mr-3 text-xs font-semibold text-ink-500 hover:text-ink-900">
                            View
                          </a>
                        )}
                        <Link href={`/admin/${config.key}/${it.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
