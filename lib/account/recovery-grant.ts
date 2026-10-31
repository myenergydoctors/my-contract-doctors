import { createHmac, timingSafeEqual } from "node:crypto";

export const recoveryCookie = "mcd_password_recovery";
const lifetimeSeconds = 15 * 60;

export function createRecoveryGrant(userId: string, secret: string, now = Date.now()): string {
  const expires = Math.floor(now / 1000) + lifetimeSeconds;
  const payload = `${userId}.${expires}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function validRecoveryGrant(value: string | undefined, userId: string, secret: string, now = Date.now()): boolean {
  if (!value) return false;
  const [subject, expiresText, signature, extra] = value.split(".");
  if (extra || subject !== userId || !/^\d{10}$/.test(expiresText ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
  const expires = Number(expiresText);
  if (expires < Math.floor(now / 1000) || expires > Math.floor(now / 1000) + lifetimeSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${subject}.${expiresText}`).digest("hex");
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}
