"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SITE_SETTINGS, SiteSettingsSchema, type SiteSettings } from "@preseedhealer/types";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { useAdminUser } from "./AdminShell";
import { getPath, setPath, useApiData } from "./hooks";
import { AdminHeader, adminInput, btn, ErrorBox, LoadingRows, Panel, Toast } from "./ui";

const phaseOptions = [
  { value: "open", label: "Open" },
  { value: "coming-soon", label: "Coming soon" },
  { value: "closed", label: "Closed" },
];

export function SettingsForm() {
  const user = useAdminUser();
  const { data, error, loading } = useApiData<SiteSettings>("/admin/settings");
  const [values, setValues] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");
  const canEdit = user?.role === "admin";

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const bind = (path: string) => ({
    id: `s-${path.replace(/\./g, "-")}`,
    value: (getPath(values, path) as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => setPath(v, path, e.target.value)),
    disabled: !canEdit,
    className: cn(adminInput, errors[path] && "border-danger-500"),
  });

  // Plain render helper (not a component) so inputs keep focus across re-renders.
  const field = ({ path, label, help, type = "text" }: { path: string; label: string; help?: string; type?: string }) => (
    <div key={path}>
      <label htmlFor={`s-${path.replace(/\./g, "-")}`} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input type={type} {...bind(path)} />
      {errors[path] ? <p className="mt-1 text-sm text-danger-700">{errors[path]}</p> : help && <p className="mt-1 text-xs text-ink-500">{help}</p>}
    </div>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = SiteSettingsSchema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path.join(".")] ??= i.message;
      setErrors(errs);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setFormError("");
    setSaving(true);
    try {
      setValues(await api<SiteSettings>("/admin/settings", { method: "PUT", body: parsed.data }));
      setToast("Settings saved. The site updates within seconds.");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <LoadingRows />;
  if (error) return <ErrorBox message={error} />;

  return (
    <form onSubmit={save} noValidate>
      <AdminHeader
        title="Site settings"
        description={canEdit ? "Changes go live on the website within seconds." : "Only admins can change settings."}
        actions={
          canEdit && (
            <button type="submit" className={btn.primary} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          )
        }
      />
      {formError && <div className="mb-4"><ErrorBox message={formError} /></div>}

      <div className="space-y-6">
        <Panel title="Announcement bar">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex min-h-10 items-center gap-3 text-sm font-semibold md:col-span-2">
              <input
                type="checkbox"
                className="size-5 accent-ink-900"
                disabled={!canEdit}
                checked={values.announcement.enabled}
                onChange={(e) => setValues((v) => setPath(v, "announcement.enabled", e.target.checked))}
              />
              Show announcement bar
            </label>
            {field({ path: "announcement.text", label: "Text", help: "Max 140 characters." })}
            {field({ path: "announcement.href", label: "Link (optional)", help: "e.g. /phase-01 or a full URL" })}
          </div>
        </Panel>

        <Panel title="Programme phases">
          <div className="grid gap-5 md:grid-cols-2">
            {(["phase01", "phase02"] as const).map((p) => (
              <div key={p} className="space-y-4 rounded-lg border border-ink-100 p-4">
                <p className="text-sm font-semibold">{p === "phase01" ? "Phase 01 (applications)" : "Phase 02"}</p>
                <div>
                  <label htmlFor={`s-phases-${p}-status`} className="mb-1.5 block text-sm font-semibold">
                    Status
                  </label>
                  <select {...bind(`phases.${p}.status`)}>
                    {phaseOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {p === "phase01" && <p className="mt-1 text-xs text-ink-500">“Closed” disables the application form.</p>}
                </div>
                {field({ path: `phases.${p}.label`, label: "Label", help: "e.g. “Open until 15 December 2026”" })}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Contact details">
          <div className="grid gap-5 md:grid-cols-2">
            {field({ path: "contact.email", label: "Public email", type: "email" })}
            {field({ path: "contact.phone", label: "Public phone", type: "tel" })}
            <div className="md:col-span-2">
              {field({ path: "contact.address", label: "Address" })}
            </div>
          </div>
        </Panel>

        <Panel title="Social links">
          <div className="grid gap-5 md:grid-cols-2">
            {field({ path: "social.linkedin", label: "LinkedIn", type: "url" })}
            {field({ path: "social.instagram", label: "Instagram", type: "url" })}
            {field({ path: "social.x", label: "X (Twitter)", type: "url" })}
            {field({ path: "social.youtube", label: "YouTube", type: "url" })}
            {field({ path: "social.whatsapp", label: "WhatsApp community / chat link", type: "url" })}
          </div>
        </Panel>
      </div>
      <Toast message={toast} onDone={() => setToast("")} />
    </form>
  );
}
