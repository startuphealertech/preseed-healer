"use client";

import Link from "next/link";
import {
  INVESTOR_TYPE_LABELS,
  INVESTOR_TYPES,
  InvestorInterestInputSchema,
  SECTORS,
  TICKET_SIZE_LABELS,
  TICKET_SIZES,
  type Sector,
} from "@preseedhealer/types";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client-api";
import { CheckboxField, ChipsField, FormAlert, Honeypot, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { useZodForm } from "./useZodForm";

type Values = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  investorType: string;
  ticketSize: string;
  sectors: Sector[];
  linkedin: string;
  message: string;
  consent: boolean;
  hp: string;
};

export function InvestorForm() {
  const form = useZodForm<Values>(InvestorInterestInputSchema, {
    name: "",
    email: "",
    phone: "",
    organization: "",
    investorType: "",
    ticketSize: "",
    sectors: [],
    linkedin: "",
    message: "",
    consent: false,
    hp: "",
  });
  const { values, errors, set } = form;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    form.setStatus("submitting");
    form.setFormError("");
    try {
      await api("/investor-interests", { method: "POST", body: data });
      form.setStatus("success");
    } catch (err) {
      form.handleServerError(err);
    }
  };

  if (form.status === "success") {
    return (
      <div className="card p-8 text-center sm:p-12" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-50 text-success-700">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-6 text-h3 font-semibold">Thanks, we&apos;ll be in touch.</h2>
        <p className="mt-3 text-ink-600">Our team will reach out to understand your thesis and share relevant founders.</p>
        <Link href="/investors" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-ink-900 px-6 font-semibold text-white hover:bg-ink-800">
          Back to investors
        </Link>
      </div>
    );
  }

  const field = <K extends keyof Values>(name: K) => ({
    name,
    value: values[name] as string,
    error: errors[name as string],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(name, e.target.value as Values[K]),
  });

  return (
    <form onSubmit={submit} noValidate className="card relative space-y-6 p-6 sm:p-10">
      <Honeypot value={values.hp} onChange={(v) => set("hp", v)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" required autoComplete="name" {...field("name")} />
        <TextField label="Organisation / fund" autoComplete="organization" {...field("organization")} />
        <TextField label="Email" type="email" required autoComplete="email" inputMode="email" {...field("email")} />
        <TextField label="Phone / WhatsApp" type="tel" required autoComplete="tel" inputMode="tel" {...field("phone")} />
        <SelectField
          label="Investor type"
          required
          options={INVESTOR_TYPES.map((t) => ({ value: t, label: INVESTOR_TYPE_LABELS[t] }))}
          {...field("investorType")}
        />
        <SelectField label="Typical cheque size" required options={TICKET_SIZES.map((t) => ({ value: t, label: TICKET_SIZE_LABELS[t] }))} {...field("ticketSize")} />
        <div className="sm:col-span-2">
          <ChipsField label="Sectors of interest" name="sectors" required options={SECTORS} value={values.sectors} onChange={(v) => set("sectors", v)} error={errors.sectors} />
        </div>
        <TextField label="LinkedIn profile" type="url" inputMode="url" placeholder="https://linkedin.com/in/…" {...field("linkedin")} className="sm:col-span-2" />
        <TextArea label="Anything else we should know?" maxLength={1000} rows={4} {...field("message")} className="sm:col-span-2" />
        <CheckboxField
          name="consent"
          checked={values.consent}
          onChange={(v) => set("consent", v)}
          error={errors.consent}
          className="sm:col-span-2"
          label={
            <>
              I agree to be contacted by PreSeedHealer and accept the{" "}
              <Link href="/legal/privacy-policy" target="_blank" className="font-medium text-brand-600 underline">
                Privacy Policy
              </Link>
              .
            </>
          }
        />
      </div>
      <FormAlert>{form.formError}</FormAlert>
      <SubmitButton submitting={form.status === "submitting"} className="w-full sm:w-auto">
        Join the investor network
      </SubmitButton>
    </form>
  );
}
