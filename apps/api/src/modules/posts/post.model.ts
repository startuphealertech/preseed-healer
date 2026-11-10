import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    coverAlt: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    tags: { type: [String], default: [] },
    author: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
    readingMinutes: { type: Number, default: 1 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
    faqs: {
      type: [{ question: String, answer: String, _id: false }],
      default: [],
    },
  },
  { timestamps: true },
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1 });
postSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" }, { weights: { title: 10, excerpt: 4, tags: 4, content: 1 } });

export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/[#>*_`[\]()|-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const Post = model("Post", postSchema);
