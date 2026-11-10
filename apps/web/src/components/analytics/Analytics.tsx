"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const COOKIE = "psh_consent";
type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`));
  return (m?.[1] as Consent) ?? null;
}

function writeConsent(value: "granted" | "denied") {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
}

/**
 * Cookie banner + Google Analytics 4, loaded only after explicit consent.
 * Renders nothing when no GA ID is configured, since there is then nothing to consent to.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, []);

  if (!gaId || !ready) return null;

  const choose = (v: "granted" | "denied") => {
    writeConsent(v);
    setConsent(v);
  };

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-[60] mx-auto max-w-xl animate-slide-up rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl sm:inset-x-6"
        >
          <p className="text-sm text-ink-700">
            We use optional analytics cookies to understand how the site is used. See our{" "}
            <Link href="/legal/cookie-policy" className="font-medium text-brand-600 underline">
              cookie policy
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => choose("granted")}
              className="min-h-11 flex-1 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose("denied")}
              className="min-h-11 flex-1 rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-900 hover:bg-ink-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
