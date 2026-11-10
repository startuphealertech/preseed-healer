import type { Metadata } from "next";
import { AccountForm } from "@/admin/AccountForm";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return <AccountForm />;
}
