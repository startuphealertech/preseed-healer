"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "block min-h-12 w-full rounded-xl border bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-400 outline-none transition-colors " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-500";

type FieldShellProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldShell({ id, label, error, hint, required, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
        {required ? (
          <span className="text-danger-500" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-ink-400"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type BaseProps = { label: ReactNode; error?: string; hint?: ReactNode; className?: string };

export function TextField({ label, error, hint, className, required, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required}
        className={cn(inputClass, error ? "border-danger-500" : "border-ink-200")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextArea({ label, error, hint, className, required, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required}
        rows={5}
        className={cn(inputClass, "min-h-32 resize-y", error ? "border-danger-500" : "border-ink-200")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  required,
  options,
  placeholder = "Select…",
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required}
        className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7491%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-10", error ? "border-danger-500" : "border-ink-200")}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  error,
  checked,
  onChange,
  name,
  className,
}: {
  label: ReactNode;
  error?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  name: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink-700">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 rounded border-ink-300 accent-ink-900"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Multi-select as toggle chips (e.g. sectors). */
export function ChipsField<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
}: {
  label: ReactNode;
  name: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  error?: string;
  required?: boolean;
}) {
  const id = useId();
  const toggle = (o: T) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-2 text-sm font-semibold text-ink-800">
        {label}
        {required && (
          <span className="text-danger-500" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            name={i === 0 ? name : undefined}
            aria-pressed={value.includes(o)}
            onClick={() => toggle(o)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
              value.includes(o) ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Off-screen trap field. Real users never see or fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
      {children}
    </div>
  );
}

export function SubmitButton({ submitting, children, className }: { submitting: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      aria-busy={submitting}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-500 px-7 font-semibold text-ink-900 transition-colors hover:bg-accent-400 disabled:opacity-60",
        className,
      )}
    >
      {submitting && <span className="size-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" aria-hidden="true" />}
      {children}
    </button>
  );
}
