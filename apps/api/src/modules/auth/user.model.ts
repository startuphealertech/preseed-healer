import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "editor"], default: "editor" },
    /** Set to false to lock the account out; existing sessions stop working immediately. */
    active: { type: Boolean, default: true },
    /** Bumped to invalidate every session issued for this user (password change, role change). */
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/** Changing the role ends existing sessions, so a demoted user has to sign in again with the new role. */
function bumpOnRoleChange(this: { getUpdate(): unknown; setUpdate(u: unknown): void }) {
  const update = (this.getUpdate() ?? {}) as Record<string, any>;
  const changesRole = "role" in update || (update.$set && "role" in update.$set);
  if (!changesRole) return;
  update.$inc = { ...(update.$inc ?? {}), tokenVersion: 1 };
  this.setUpdate(update);
}
userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], bumpOnRoleChange);
userSchema.pre("save", function () {
  if (!this.isNew && this.isModified("role")) this.tokenVersion = (this.tokenVersion ?? 0) + 1;
});

export const User = model("User", userSchema);

/** Session ids (JWT `jti`) ended by logout. Rows expire with the token they revoke. */
const revokedSessionSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});
revokedSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RevokedSession = model("RevokedSession", revokedSessionSchema);
