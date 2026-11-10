"use client";

import { useEffect, useRef, useState } from "react";
import type { FaqItem } from "@preseedhealer/types";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { adminInput, btn } from "./ui";

/** Image field: upload to /admin/media or paste a URL; shows a preview. */
export function ImageInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("/admin/media", { method: "POST", body: fd });
      onChange(res.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id={id} className={adminInput} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button type="button" className={btn.secondary} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Uploading…" : "Upload"}
        </button>
        {value && (
          <button type="button" className={btn.ghost} onClick={() => onChange("")}>
            Remove
          </button>
        )}
      </div>
      {err && <p className="text-sm text-danger-700">{err}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URLs
        <img src={value} alt="" className="max-h-40 rounded-lg border border-ink-200 bg-ink-50 object-contain" />
      )}
    </div>
  );
}

/** Markdown textarea with Write/Preview tabs (preview uses the same renderer as the live site). */
export function MarkdownInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (tab !== "preview") return;
    let live = true;
    fetch("/api/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ markdown: value }) })
      .then((r) => r.json())
      .then((j) => live && setHtml(j?.data?.html ?? ""))
      .catch(() => live && setHtml("<p>Preview unavailable.</p>"));
    return () => {
      live = false;
    };
  }, [tab, value]);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200">
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-2" role="tablist">
        <div className="flex">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("min-h-10 px-3 text-sm font-semibold capitalize", tab === t ? "text-ink-900" : "text-ink-500")}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="hidden px-2 text-xs text-ink-400 sm:block">Markdown: ## Heading, **bold**, [link](url), | tables |</span>
      </div>
      {tab === "write" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={22}
          spellCheck
          className="block w-full resize-y p-4 font-mono text-sm leading-relaxed outline-none"
        />
      ) : (
        <div className="article max-h-[40rem] overflow-y-auto p-5 !text-base" dangerouslySetInnerHTML={{ __html: html || "<p><em>Nothing to preview.</em></p>" }} />
      )}
    </div>
  );
}

export function TagsInput({ id, value, onChange }: { id: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 p-2">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ink-100 py-1 pr-1 pl-3 text-xs font-medium">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-5 place-items-center rounded-full hover:bg-ink-200">
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder="Add tag, press Enter"
        className="min-h-8 min-w-32 flex-1 text-sm outline-none"
      />
    </div>
  );
}

export function FaqsInput({ value, onChange }: { value: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  const update = (i: number, patch: Partial<FaqItem>) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-ink-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Q{i + 1}</span>
            <button type="button" className="text-xs font-semibold text-danger-700" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
          <input aria-label={`Question ${i + 1}`} className={adminInput} value={f.question} placeholder="Question" onChange={(e) => update(i, { question: e.target.value })} />
          <textarea aria-label={`Answer ${i + 1}`} className={cn(adminInput, "min-h-20")} value={f.answer} placeholder="Answer" onChange={(e) => update(i, { answer: e.target.value })} />
        </div>
      ))}
      <button type="button" className={btn.secondary} onClick={() => onChange([...value, { question: "", answer: "" }])}>
        + Add FAQ
      </button>
    </div>
  );
}
