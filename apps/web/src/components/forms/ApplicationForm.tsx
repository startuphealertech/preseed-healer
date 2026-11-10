"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ApplicationInputSchema,
  SECTORS,
  STARTUP_STAGE_LABELS,
  STARTUP_STAGES,
  type ApplicationInput,
} from "@preseedhealer/types";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { CheckboxField, FormAlert, Honeypot, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { useZodForm } from "./useZodForm";

type Values = {
  founderName: string;
  email: string;
  phone: string;
  linkedin: string;
  city: string;
  startupName: string;
  website: string;
  sector: string;
  stage: string;
  foundedYear: string;
  teamSize: string;
  dpiitRecognised: boolean;
  oneLiner: string;
  description: string;
  raisedSoFar: string;
  fundingAsk: string;
  monthlyRevenue: string;
  pitchDeckUrl: string;
  heardFrom: string;
  consent: boolean;
  hp: string;
};

const initial: Values = {
  founderName: "",
  email: "",
  phone: "",
  linkedin: "",
  city: "",
  startupName: "",
  website: "",
  sector: "",
  stage: "",
  foundedYear: "",
  teamSize: "",
  dpiitRecognised: false,
  oneLiner: "",
  description: "",
  raisedSoFar: "",
  fundingAsk: "",
  monthlyRevenue: "",
  pitchDeckUrl: "",
  heardFrom: "",
  consent: false,
  hp: "",
};

const steps: { title: string; fields: (keyof Values)[] }[] = [
  { title: "Founder", fields: ["founderName", "email", "phone", "city", "linkedin"] },
  { title: "Startup", fields: ["startupName", "website", "sector", "stage", "foundedYear", "teamSize", "dpiitRecognised", "oneLiner", "description"] },
  { title: "Fundraising", fields: ["raisedSoFar", "fundingAsk", "monthlyRevenue", "pitchDeckUrl", "heardFrom", "consent"] },
];

/** 3-step startup application. Validates each step client-side with the same Zod schema the API uses. */
export function ApplicationForm() {
  const form = useZodForm<Values>(ApplicationInputSchema, initial);
  const { values, errors, set } = form;
  const [step, setStep] = useState(0);
  const [refCode, setRefCode] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const goTo = (n: number) => {
    setStep(n);
    form.setFormError("");
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const next = () => {
    if (form.validate(steps[step]!.fields)) goTo(step + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < steps.length - 1) return next();
    // Jump back to the first step with an error (computed from a fresh parse, not stale state).
    const check = ApplicationInputSchema.safeParse(values);
    if (!check.success) {
      const bad = new Set(check.error.issues.map((i) => String(i.path[0])));
      const firstBad = steps.findIndex((s) => s.fields.some((f) => bad.has(f as string)));
      if (firstBad >= 0 && firstBad !== step) goTo(firstBad);
    }
    const data = form.validate();
    if (!data) return;
    form.setStatus("submitting");
    form.setFormError("");
    try {
      const res = await api<{ refCode: string }>("/applications", { method: "POST", body: data as ApplicationInput });
      setRefCode(res.refCode);
      form.setStatus("success");
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      form.handleServerError(err);
      const fields = Object.keys((err as { fields?: object }).fields ?? {});
      const firstBad = steps.findIndex((s) => s.fields.some((f) => fields.includes(f as string)));
      if (firstBad >= 0) setStep(firstBad);
    }
  };

  if (form.status === "success") {
    return (
      <div ref={topRef} className="card scroll-mt-28 p-8 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-50 text-success-700">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-6 text-h3 font-semibold">Application received!</h2>
        <p className="mt-3 text-ink-600">
          Thank you, {values.founderName.split(" ")[0]}. We&apos;ve emailed a confirmation to <strong>{values.email}</strong>.
        </p>
        <p className="mt-6 inline-block rounded-xl bg-ink-50 px-5 py-3 font-mono text-lg font-semibold tracking-wider">{refCode}</p>
        <p className="mt-2 text-sm text-ink-500">Your reference number. Keep it for any follow-up.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/insights/what-happens-after-you-apply" className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink-900 px-6 font-semibold text-white hover:bg-ink-800">
            What happens next
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink-200 px-6 font-semibold hover:bg-ink-50">
            Back to home
          </Link>
        </div>
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
    <div ref={topRef} className="scroll-mt-28">
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Application progress">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && goTo(i)}
              aria-current={i === step ? "step" : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className={cn("block h-1.5 rounded-full transition-colors", i <= step ? "bg-ink-900" : "bg-ink-200")} />
              <span className={cn("mt-2 block text-xs font-semibold sm:text-sm", i === step ? "text-ink-900" : "text-ink-500")}>
                <span className="hidden sm:inline">Step {i + 1}: </span>
                {s.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate className="card relative space-y-6 p-6 sm:p-10">
        <Honeypot value={values.hp} onChange={(v) => set("hp", v)} />
        <h2 className="font-display text-xl font-semibold">
          {step === 0 && "Tell us about you"}
          {step === 1 && "Tell us about your startup"}
          {step === 2 && "Your fundraise"}
        </h2>

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Full name" required autoComplete="name" {...field("founderName")} className="sm:col-span-2" />
            <TextField label="Email" type="email" required autoComplete="email" inputMode="email" {...field("email")} />
            <TextField label="Phone / WhatsApp" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" {...field("phone")} />
            <TextField label="City" required autoComplete="address-level2" {...field("city")} />
            <TextField label="LinkedIn profile" type="url" inputMode="url" placeholder="https://linkedin.com/in/…" {...field("linkedin")} />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Startup name" required autoComplete="organization" {...field("startupName")} />
            <TextField label="Website" type="url" inputMode="url" placeholder="https://" {...field("website")} />
            <SelectField label="Sector" required options={SECTORS.map((s) => ({ value: s, label: s }))} {...field("sector")} />
            <SelectField
              label="Stage"
              required
              options={STARTUP_STAGES.map((s) => ({ value: s, label: STARTUP_STAGE_LABELS[s] }))}
              {...field("stage")}
            />
            <TextField label="Year founded" required inputMode="numeric" placeholder="2025" maxLength={4} {...field("foundedYear")} />
            <TextField label="Team size" required inputMode="numeric" placeholder="4" {...field("teamSize")} />
            <TextField
              label="One-line description"
              required
              maxLength={200}
              placeholder="We help X do Y by Z"
              hint={`${values.oneLiner.length}/200`}
              {...field("oneLiner")}
              className="sm:col-span-2"
            />
            <TextArea
              label="What problem are you solving, and how?"
              required
              maxLength={2000}
              hint={`${values.description.length}/2000 · Problem, solution, customers and traction so far`}
              {...field("description")}
              className="sm:col-span-2"
            />
            <CheckboxField
              name="dpiitRecognised"
              label="My startup is DPIIT-recognised (Startup India)"
              checked={values.dpiitRecognised}
              onChange={(v) => set("dpiitRecognised", v)}
              className="sm:col-span-2"
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Raised so far" placeholder="e.g. ₹25L angel / bootstrapped" {...field("raisedSoFar")} />
            <TextField label="How much are you raising?" required placeholder="e.g. ₹1.5 Cr" {...field("fundingAsk")} />
            <TextField label="Monthly revenue" placeholder="e.g. ₹3L MRR / pre-revenue" {...field("monthlyRevenue")} />
            <TextField
              label="Pitch deck link"
              type="url"
              required
              inputMode="url"
              placeholder="https://drive.google.com/…"
              hint="Make sure the link is viewable by anyone with it."
              {...field("pitchDeckUrl")}
            />
            <TextField label="How did you hear about us?" {...field("heardFrom")} className="sm:col-span-2" />
            <CheckboxField
              name="consent"
              checked={values.consent}
              onChange={(v) => set("consent", v)}
              error={errors.consent}
              className="sm:col-span-2"
              label={
                <>
                  I confirm the information is accurate and agree to the{" "}
                  <Link href="/legal/privacy-policy" target="_blank" className="font-medium text-brand-600 underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/application-selection" target="_blank" className="font-medium text-brand-600 underline">
                    Application &amp; Selection terms
                  </Link>
                  , including sharing my startup&apos;s details with relevant investors.
                </>
              }
            />
          </div>
        )}

        <FormAlert>{form.formError}</FormAlert>

        <div className="flex flex-col-reverse gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} className="min-h-12 rounded-full px-5 font-semibold text-ink-700 hover:bg-ink-50">
              ← Back
            </button>
          ) : (
            <span className="text-sm text-ink-500">Takes about 10 minutes</span>
          )}
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink-900 px-7 font-semibold text-white hover:bg-ink-800">
              Continue <Icon name="arrowRight" className="size-4" />
            </button>
          ) : (
            <SubmitButton submitting={form.status === "submitting"}>Submit application</SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
