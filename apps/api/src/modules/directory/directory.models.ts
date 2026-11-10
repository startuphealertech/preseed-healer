import { Schema, model } from "mongoose";
import { PARTNER_TYPES } from "@preseedhealer/types";

const partnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, default: "" },
    role: { type: String, default: "" },
    type: { type: String, enum: PARTNER_TYPES, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    website: { type: String, default: "" },
    showOnInvestors: { type: Boolean, default: true },
    showOnPartners: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);
partnerSchema.index({ published: 1, order: 1, name: 1 });
export const Partner = model("Partner", partnerSchema);

const faqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    group: { type: String, default: "General" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);
faqSchema.index({ published: 1, group: 1, order: 1 });
export const Faq = model("Faq", faqSchema);

const pageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, default: "" },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Page = model("Page", pageSchema);
