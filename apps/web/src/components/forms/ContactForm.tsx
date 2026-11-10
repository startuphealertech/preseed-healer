"use client";

import { CONTACT_SUBJECT_LABELS, CONTACT_SUBJECTS, ContactInputSchema } from "@preseedhealer/types";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client-api";
import { FormAlert, Honeypot, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { useZodForm } from "./useZodForm";

type Values = { name: string; email: string; phone: string; subject: string; message: string; hp: string };

export function ContactForm({ defaultSubject = "general" }: { defaultSubject?: string }) {
  const subject = (CONTACT_SUBJECTS as readonly string[]).includes(defaultSubject) ? defaultSubject : "general";
  const form = useZodForm<Values>(ContactInputSchema, { name: "", email: "", phone: "", subject, message: "", hp: "" });
  const { values, errors, set } = form;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    form.setStatus("submitting");
    form.setFormError("");
    try {
      await api("/contact", { method: "POST", body: data });
      form.setStatus("success");
    } catch (err) {
      form.handleServerError(err);
    }
  };

  if (form.status === "success") {
    return (
      <div className="card p-8 text-center sm:p-10" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-50 text-success-700">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-6 text-h3 font-semibold">Message sent</h2>
        <p className="mt-3 text-ink-600">Thanks for writing in. We usually reply within two working days.</p>
      </div>
    );
  }

  const field = <K extends keyof Values>(name: K) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(name, e.target.value),
  });

  return (
    <form onSubmit={submit} noValidate className="card relative space-y-5 p-6 sm:p-8">
      <Honeypot value={values.hp} onChange={(v) => set("hp", v)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" required autoComplete="name" {...field("name")} />
        <TextField label="Email" type="email" required autoComplete="email" inputMode="email" {...field("email")} />
        <TextField label="Phone" type="tel" autoComplete="tel" inputMode="tel" {...field("phone")} />
        <SelectField label="Subject" required options={CONTACT_SUBJECTS.map((s) => ({ value: s, label: CONTACT_SUBJECT_LABELS[s] }))} {...field("subject")} />
        <TextArea label="Message" required maxLength={2000} {...field("message")} className="sm:col-span-2" />
      </div>
      <FormAlert>{form.formError}</FormAlert>
      <SubmitButton submitting={form.status === "submitting"} className="w-full sm:w-auto">
        Send message
      </SubmitButton>
    </form>
  );
}
