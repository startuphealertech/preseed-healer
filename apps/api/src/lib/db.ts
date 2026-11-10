import mongoose from "mongoose";
import { env, isProd } from "../config/env";

mongoose.set("strictQuery", true);

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    // Build indexes automatically in dev; in prod they are created deliberately.
    autoIndex: !isProd,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`[db] connected to ${mongoose.connection.name}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
