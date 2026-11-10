import { notFound } from "next/navigation";
import { ResourceForm } from "@/admin/ResourceForm";
import { RESOURCE_KEYS } from "@/admin/resource-keys";

type Props = { params: Promise<{ resource: string; id: string }> };

export default async function ResourceEditPage({ params }: Props) {
  const { resource, id } = await params;
  if (!RESOURCE_KEYS.includes(resource) || !/^[a-f\d]{24}$/i.test(id)) notFound();
  return <ResourceForm resourceKey={resource} id={id} />;
}
