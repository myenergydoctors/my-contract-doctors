import { timingSafeEqual } from "node:crypto";
export function validCronAuth(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const actual = Buffer.from(header), expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function cronUserScope(url: URL): string | undefined {
  const userId = url.searchParams.get("user_id");
  if (userId === null) return undefined;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(userId)) throw new Error("Invalid account scope");
  return userId;
}
