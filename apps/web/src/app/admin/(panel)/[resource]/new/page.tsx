import { notFound } from "next/navigation";
import { ResourceForm } from "@/admin/ResourceForm";
import { RESOURCE_KEYS } from "@/admin/resource-keys";

type Props = { params: Promise<{ resource: string }> };

export default async function ResourceNewPage({ params }: Props) {
  const { resource } = await params;
  if (!RESOURCE_KEYS.includes(resource)) notFound();
  return <ResourceForm resourceKey={resource} />;
}
