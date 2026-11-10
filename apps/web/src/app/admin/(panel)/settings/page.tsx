import type { Metadata } from "next";
import { SettingsForm } from "@/admin/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsForm />;
}
