import { SiteSettingsSchema, type SiteSettings } from "@preseedhealer/types";
import { Settings } from "./settings.model";

/** Returns the singleton settings document, creating it with defaults on first read. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await Settings.findOneAndUpdate(
    { key: "site" },
    { $setOnInsert: { key: "site" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, lean: true },
  );
  // Parse through the shared schema so the API never leaks internal fields (_id, key, timestamps).
  return SiteSettingsSchema.parse(doc);
}
