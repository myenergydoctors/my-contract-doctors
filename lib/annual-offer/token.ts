import { createHmac, timingSafeEqual } from "node:crypto";
export function signOfferId(id: string, secret: string) {
  return `${id}.${createHmac("sha256", secret).update(`annual30-v1:${id}`).digest("hex")}`;
}
export function verifyOfferCookie(
  value: string | undefined,
  secret: string,
): string | null {
  if (!value) return null;
  const [id, signature, ...extra] = value.split(".");
  if (
    extra.length ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    ) ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return null;
  const expected = signOfferId(id, secret).split(".")[1];
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  )
    ? id
    : null;
}
