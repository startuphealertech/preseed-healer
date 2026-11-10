import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "editor"], default: "editor" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
