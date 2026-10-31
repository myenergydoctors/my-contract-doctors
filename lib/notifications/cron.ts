import { timingSafeEqual } from "node:crypto";
export function validCronAuth(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const actual = Buffer.from(header), expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
