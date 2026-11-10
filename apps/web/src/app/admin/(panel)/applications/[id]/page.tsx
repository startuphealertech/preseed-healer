import { notFound } from "next/navigation";
import { SubmissionDetail } from "@/admin/submissions";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  return <SubmissionDetail kindKey="applications" id={id} />;
}
