// Discount codes — validated and redeemed server-side (see
// app/api/discount-codes/*). Codes and redemption state live in Supabase,
// not in the browser, so they can't be tampered with client-side the way
// the old localStorage-only version could be.

const ANON_ID_KEY = "mcd_anon_id";

// A single opaque id per browser, used only to tie one chat-assistant code
// to "whoever's browser this is" so the chat widget can't be re-clicked for
// unlimited codes. Not a real identity — clearing storage resets it, same
// limitation any unauthenticated discount flow has.
function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export type ClaimedDiscount = { code: string; discountPct: number };

export async function claimChatDiscount(): Promise<ClaimedDiscount> {
  const res = await fetch("/api/discount-codes/chat-claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonId: getAnonId() }),
  });
  if (!res.ok) throw new Error("Couldn't generate a discount code right now.");
  return res.json();
}

export type ValidateResult =
  | { ok: true; code: string; discountPct: number }
  | { ok: false; reason: string };

export async function validateDiscount(code: string, plan: string, email?: string): Promise<ValidateResult> {
  if (!code.trim()) return { ok: false, reason: "Enter a code." };
  const res = await fetch("/api/discount-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, plan, email }),
  });
  return res.json();
}

export async function redeemDiscount(code: string, plan: string, email?: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch("/api/discount-codes/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, plan, email }),
  });
  return res.json();
}
