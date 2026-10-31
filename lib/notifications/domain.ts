import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type EmailCategory = "analysis" | "renewal";
export const reminderLeads = [90, 30, 7, 1, 0] as const;
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function dueReminder(deadline: string, now = new Date()) {
  if (!validDate(deadline)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((Date.parse(`${deadline}T00:00:00Z`) - today) / 86400000);
  if (days < 0 || days > 90) return null;
  const lead = [...reminderLeads].reverse().find(value => days <= value)!;
  return { lead, days };
}
export function eventId(key: string) {
  const value = createHash("sha256").update(key).digest("hex");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-8${value.slice(13, 16)}-a${value.slice(17, 20)}-${value.slice(20, 32)}`;
}
export function unsubscribeToken(userId: string, category: EmailCategory, secret: string) {
  const payload = `${userId}.${category}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function readUnsubscribeToken(token: unknown, secret: string) {
  if (typeof token !== "string" || token.length > 150) return null;
  const [userId, category, signature, extra] = token.split(".");
  if (extra || !/^[a-f0-9-]{36}$/i.test(userId ?? "") || !["analysis", "renewal"].includes(category) || !/^[a-f0-9]{64}$/.test(signature ?? "")) return null;
  const expected = unsubscribeToken(userId, category as EmailCategory, secret).split(".")[2];
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex")) ? { userId, category: category as EmailCategory } : null;
}
export function deliveryFailure(status: number | undefined, attempts: number, now = new Date()) {
  if (!status) return { status: "uncertain", next_attempt_at: now.toISOString() };
  if ((status === 429 || status >= 500) && attempts < 5) return {
    status: "pending", next_attempt_at: new Date(now.getTime() + Math.min(360, 5 * 2 ** (attempts - 1)) * 60000).toISOString(),
  };
  return { status: "failed", next_attempt_at: now.toISOString() };
}
