import "server-only";
import { cache } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@preseedhealer/types";
import { apiGet } from "./api";

export const SETTINGS_TAG = "settings";

/**
 * Site settings from the API, de-duplicated per request.
 * Falls back to defaults so pages still render (and builds still pass) when the API is down.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await apiGet<SiteSettings>("/settings", { tags: [SETTINGS_TAG], revalidate: 300 });
  } catch (err) {
    console.warn("[settings] API unavailable, using defaults:", (err as Error).message);
    return DEFAULT_SITE_SETTINGS;
  }
});
