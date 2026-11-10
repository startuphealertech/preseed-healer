"use client";

import { useState } from "react";
import { ChangePasswordSchema } from "@preseedhealer/types";
import { api } from "@/lib/client-api";
import { useAdminUser } from "./AdminShell";
import { AdminHeader, adminInput, btn, ErrorBox, Panel, Toast } from "./ui";

export function AccountForm() {
  const user = useAdminUser();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) return setError("New passwords don't match.");
    const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    try {
      await api("/auth/password", { method: "POST", body: parsed.data });
      setCurrent("");
      setNew("");
      setConfirm("");
      setToast("Password updated");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader title="Account" description={user ? `${user.email} · ${user.role}` : undefined} />
      <Panel title="Change password" className="max-w-lg">
        <form onSubmit={submit} noValidate className="space-y-4">
          {[
            { id: "cur", label: "Current password", value: currentPassword, set: setCurrent, auto: "current-password" },
            { id: "new", label: "New password (min 10 characters)", value: newPassword, set: setNew, auto: "new-password" },
            { id: "conf", label: "Confirm new password", value: confirm, set: setConfirm, auto: "new-password" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="mb-1.5 block text-sm font-semibold">
                {f.label}
              </label>
              <input id={f.id} type="password" autoComplete={f.auto} value={f.value} onChange={(e) => f.set(e.target.value)} className={adminInput} />
            </div>
          ))}
          {error && <ErrorBox message={error} />}
          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </Panel>
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}
