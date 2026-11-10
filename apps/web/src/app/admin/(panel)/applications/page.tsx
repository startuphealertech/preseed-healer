import type { Metadata } from "next";
import { SubmissionList } from "@/admin/submissions";

export const metadata: Metadata = { title: "Applications" };

export default function Page() {
  return <SubmissionList kindKey="applications" />;
}
