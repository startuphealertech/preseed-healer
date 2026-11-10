/**
 * Idempotent seed: safe to run repeatedly. Creates missing content only and never overwrites edits.
 *   npm run seed -w @preseedhealer/api
 */
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { env } from "../config/env";
import { connectDb, disconnectDb } from "../lib/db";
import { RevokedSession, User } from "../modules/auth/user.model";
import { Faq, Page, Partner } from "../modules/directory/directory.models";
import { Category } from "../modules/posts/category.model";
import { Post, readingMinutes } from "../modules/posts/post.model";
import { getSiteSettings } from "../modules/settings/settings.service";
import { Application, ContactMessage, InvestorInterest } from "../modules/submissions/submissions.models";
import * as data from "./seed-data";

async function seed() {
  await connectDb();

  // Admin
  if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
    if (env.SEED_ADMIN_PASSWORD.length < 10) throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters");
    const exists = await User.exists({ email: env.SEED_ADMIN_EMAIL.toLowerCase() });
    if (!exists) {
      await User.create({
        email: env.SEED_ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
      });
      console.log(`✓ admin created: ${env.SEED_ADMIN_EMAIL}`);
    } else console.log(`• admin exists: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set, skipping admin");
  }

  await getSiteSettings(); // creates the settings singleton with defaults

  // Categories
  const catIds = new Map<string, Types.ObjectId>();
  for (const c of data.categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, { $setOnInsert: c }, { upsert: true, returnDocument: "after" });
    catIds.set(c.slug, doc._id);
  }
  console.log(`✓ categories: ${data.categories.length}`);

  // Posts (staggered dates so ordering looks natural)
  let created = 0;
  for (const [i, p] of data.posts.entries()) {
    if (await Post.exists({ slug: p.slug })) continue;
    const { category, ...rest } = p;
    await Post.create({
      ...rest,
      category: catIds.get(category) ?? null,
      status: "published",
      publishedAt: new Date(Date.now() - (i + 1) * 86_400_000),
      readingMinutes: readingMinutes(p.content),
    });
    created++;
  }
  console.log(`✓ posts: ${created} created`);

  if ((await Partner.estimatedDocumentCount()) === 0) {
    await Partner.insertMany(data.partners);
    console.log(`✓ partners: ${data.partners.length} sample entries`);
  } else console.log("• partners exist, skipping");

  if ((await Faq.estimatedDocumentCount()) === 0) {
    await Faq.insertMany(data.faqs);
    console.log(`✓ faqs: ${data.faqs.length}`);
  } else console.log("• faqs exist, skipping");

  let pagesCreated = 0;
  for (const page of data.pages) {
    const res = await Page.updateOne({ slug: page.slug }, { $setOnInsert: page }, { upsert: true });
    pagesCreated += res.upsertedCount;
  }
  console.log(`✓ legal pages: ${pagesCreated} created`);

  // Build indexes (autoIndex is off in production).
  await Promise.all([Post, Category, Partner, Faq, Page, User, RevokedSession, Application, InvestorInterest, ContactMessage].map((m) => (m as any).syncIndexes()));
  console.log("✓ indexes synced");

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
