import { notFound } from "next/navigation";
import { ResourceList } from "@/admin/ResourceList";
import { RESOURCE_KEYS } from "@/admin/resource-keys";

type Props = { params: Promise<{ resource: string }> };

export default async function ResourceListPage({ params }: Props) {
  const { resource } = await params;
  if (!RESOURCE_KEYS.includes(resource)) notFound();
  return <ResourceList resourceKey={resource} />;
}
