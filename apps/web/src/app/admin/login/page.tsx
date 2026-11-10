import type { Metadata } from "next";
import { LoginForm } from "@/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-accent-500 font-display text-xl font-bold text-ink-900">P</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">PreSeedHealer Admin</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to manage the website</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
