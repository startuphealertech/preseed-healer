"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiClientError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { getPath, setPath, useApiData } from "./hooks";
import { FaqsInput, ImageInput, MarkdownInput, TagsInput } from "./inputs";
import { resources, type FieldDef } from "./resources";
import { AdminHeader, adminInput, btn, ConfirmButton, ErrorBox, LoadingRows, Panel, Toast } from "./ui";

type Values = Record<string, any>;

function OptionsSelect({ field, id, value, onChange }: { field: FieldDef; id: string; value: string; onChange: (v: string) => void }) {
  const { data } = useApiData<any[]>(field.optionsFrom?.endpoint ?? null);
  const options = field.optionsFrom
    ? (data ?? []).map((d) => ({ value: String(d[field.optionsFrom!.value]), label: String(d[field.optionsFrom!.label]) }))
    : (field.options ?? []);
  return (
    <select id={id} className={adminInput} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {field.optionsFrom?.empty !== undefined && <option value="">{field.optionsFrom.empty}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const id = `f-${field.name.replace(/\./g, "-")}`;
  switch (field.type) {
    case "textarea":
      return <textarea id={id} className={cn(adminInput, "min-h-24")} value={value ?? ""} maxLength={field.maxLength} onChange={(e) => onChange(e.target.value)} />;
    case "markdown":
      return <MarkdownInput id={id} value={value ?? ""} onChange={onChange} />;
    case "select":
      return <OptionsSelect field={field} id={id} value={value} onChange={onChange} />;
    case "checkbox":
      return (
        <label htmlFor={id} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
          <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-ink-900" />
          {field.label}
        </label>
      );
    case "number":
      return <input id={id} type="number" inputMode="numeric" className={adminInput} value={value ?? 0} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "image":
      return <ImageInput id={id} value={value ?? ""} onChange={onChange} />;
    case "tags":
      return <TagsInput id={id} value={value ?? []} onChange={onChange} />;
    case "datetime":
      return <input id={id} type="datetime-local" className={adminInput} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "faqs":
      return <FaqsInput value={value ?? []} onChange={onChange} />;
    case "url":
      return <input id={id} type="url" inputMode="url" className={adminInput} value={value ?? ""} placeholder="https://" onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input id={id} type="text" className={adminInput} value={value ?? ""} maxLength={field.maxLength} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Create/edit form generated from a ResourceConfig. Validates with the shared Zod schema. */
export function ResourceForm({ resourceKey, id }: { resourceKey: string; id?: string }) {
  const config = resources[resourceKey]!;
  const router = useRouter();
  const isNew = !id;
  const { data, error: loadError, loading } = useApiData<any>(isNew ? null : `${config.endpoint}/${id}`);
  const [values, setValues] = useState<Values>(config.defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (data) setValues({ ...config.defaults, ...(config.toForm ? config.toForm(data) : data) });
  }, [data, config]);

  const sections = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    for (const f of config.fields) map.set(f.section, [...(map.get(f.section) ?? []), f]);
    return [...map.entries()];
  }, [config.fields]);

  const set = (name: string, v: unknown) => {
    setValues((prev) => setPath(prev, name, v));
    setErrors((e) => {
      if (!e[name]) return e;
      const { [name]: _x, ...rest } = e;
      return rest;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const parsed = config.schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path.join(".")] ??= i.message;
      setErrors(errs);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const saved = await api<any>(isNew ? config.endpoint : `${config.endpoint}/${id}`, {
        method: isNew ? "POST" : "PATCH",
        body: parsed.data,
      });
      if (isNew) {
        router.replace(`/admin/${config.key}/${saved.id}?created=1`);
      } else {
        setValues({ ...config.defaults, ...(config.toForm ? config.toForm(saved) : saved) });
        setToast("Saved. The live site updates within seconds.");
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0] ?? "Invalid"])));
      }
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await api(`${config.endpoint}/${id}`, { method: "DELETE" });
    router.replace(`/admin/${config.key}`);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(location.search).get("created")) setToast(`${config.singular} created.`);
  }, [config.singular]);

  if (!isNew && loading) return <LoadingRows />;
  if (loadError) return <ErrorBox message={loadError} />;

  const view = !isNew && data ? config.viewHref?.({ ...data, ...values }) : null;
  const title = isNew ? `New ${config.singular.toLowerCase()}` : String(values.title ?? values.name ?? values.question ?? config.singular);

  return (
    <form onSubmit={save} noValidate>
      <AdminHeader
        title={title}
        back={{ href: `/admin/${config.key}`, label: config.title }}
        actions={
          <>
            {view && (
              <a href={view} target="_blank" rel="noreferrer" className={btn.secondary}>
                View on site ↗
              </a>
            )}
            <button type="submit" className={btn.primary} disabled={saving}>
              {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
            </button>
          </>
        }
      />

      {formError && <div className="mb-4"><ErrorBox message={formError} /></div>}

      <div className="space-y-6">
        {sections.map(([section, fields]) => (
          <Panel key={section} title={section}>
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((f) => {
                const err = errors[f.name];
                const val = getPath(values, f.name);
                const id = `f-${f.name.replace(/\./g, "-")}`;
                return (
                  <div key={f.name} className={cn(f.wide && "md:col-span-2")}>
                    {f.type !== "checkbox" && (
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <label htmlFor={id} className="text-sm font-semibold text-ink-800">
                          {f.label}
                          {f.required && <span className="text-danger-500"> *</span>}
                        </label>
                        {f.maxLength && typeof val === "string" && (
                          <span className={cn("text-xs", val.length > f.maxLength * 0.9 ? "text-accent-700" : "text-ink-400")}>
                            {val.length}/{f.maxLength}
                          </span>
                        )}
                      </div>
                    )}
                    <FieldInput field={f} value={val} onChange={(v) => set(f.name, v)} />
                    {err ? (
                      <p className="mt-1 text-sm font-medium text-danger-700">{err}</p>
                    ) : (
                      f.help && <p className="mt-1 text-xs text-ink-500">{f.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {!isNew ? <ConfirmButton onConfirm={remove}>Delete {config.singular.toLowerCase()}</ConfirmButton> : <span />}
        <button type="submit" className={btn.primary} disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
        </button>
      </div>

      <Toast message={toast} onDone={() => setToast("")} />
    </form>
  );
}
