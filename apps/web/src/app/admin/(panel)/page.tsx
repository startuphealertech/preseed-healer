import type { Metadata } from "next";
import { Dashboard } from "@/admin/Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminHome() {
  return <Dashboard />;
}
