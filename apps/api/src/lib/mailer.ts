import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

/** Sends an email, or logs it when SMTP isn't configured. Never throws. */
export async function sendMail({ to, subject, text, replyTo }: Mail): Promise<void> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  const t = getTransporter();
  if (!t) {
    console.log(`[mail:dev] to=${recipients.join(",")} subject="${subject}"\n${text}\n`);
    return;
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, to: recipients, subject, text, replyTo });
  } catch (err) {
    console.error("[mail] send failed:", (err as Error).message);
  }
}

/** Alert the team inboxes configured in NOTIFY_EMAILS. */
export function notifyTeam(subject: string, text: string, replyTo?: string): void {
  void sendMail({ to: env.NOTIFY_EMAILS, subject, text, replyTo });
}
