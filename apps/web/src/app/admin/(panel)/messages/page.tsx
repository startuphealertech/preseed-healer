import type { Metadata } from "next";
import { SubmissionList } from "@/admin/submissions";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <SubmissionList kindKey="messages" />;
}
