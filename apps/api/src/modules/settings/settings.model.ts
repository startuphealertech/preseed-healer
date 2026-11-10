import { Schema, model, type InferSchemaType } from "mongoose";
import { DEFAULT_SITE_SETTINGS } from "@preseedhealer/types";

const phaseSchema = new Schema(
  {
    status: { type: String, enum: ["open", "closed", "coming-soon"], required: true },
    label: { type: String, default: "" },
  },
  { _id: false },
);

/** Singleton document (key = "site") holding site-wide settings. */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    announcement: {
      enabled: { type: Boolean, default: DEFAULT_SITE_SETTINGS.announcement.enabled },
      text: { type: String, default: DEFAULT_SITE_SETTINGS.announcement.text },
      href: { type: String, default: DEFAULT_SITE_SETTINGS.announcement.href },
    },
    phases: {
      phase01: { type: phaseSchema, default: () => DEFAULT_SITE_SETTINGS.phases.phase01 },
      phase02: { type: phaseSchema, default: () => DEFAULT_SITE_SETTINGS.phases.phase02 },
    },
    contact: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    social: {
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      x: { type: String, default: "" },
      youtube: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
export const Settings = model("Settings", settingsSchema);
