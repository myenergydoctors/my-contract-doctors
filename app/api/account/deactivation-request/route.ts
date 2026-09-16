import { createHash, randomBytes } from "node:crypto";
import sgMail from "@sendgrid/mail";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return NextResponse.json({ error: "Sign in with a verified email first." }, { status: 401, headers });

  const limit = await checkRateLimit(request, { namespace: "account-deactivation", maxRequests: 3, windowSeconds: 3600, identity: user.id });
  if (!limit.allowed) return rateLimitResponse(limit);

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("deactivated_at").eq("id", user.id).maybeSingle();
  if (profileError || !profile || profile.deactivated_at) return NextResponse.json({ error: "Account deactivation is unavailable." }, { status: 409, headers });
  const mailKey = process.env.SENDGRID_API_KEY;
  if (!mailKey) return NextResponse.json({ error: "Confirmation email is temporarily unavailable." }, { status: 503, headers });

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
  const { error: challengeError } = await admin.from("account_deactivation_challenges").upsert({
    user_id: user.id, token_hash: tokenHash, requested_at: new Date().toISOString(), expires_at: expiresAt, consumed_at: null,
  });
  if (challengeError) return NextResponse.json({ error: "Could not prepare deactivation. Please try again." }, { status: 503, headers });
  const { error: auditError } = await admin.from("account_lifecycle_events").insert({ user_id: user.id, event_type: "deactivation_requested" });
  if (auditError) return NextResponse.json({ error: "Could not prepare deactivation. Please try again." }, { status: 503, headers });

  const confirmationUrl = new URL("/account/deactivate", request.nextUrl.origin);
  confirmationUrl.searchParams.set("token", token);
  try {
    sgMail.setApiKey(mailKey);
    await sgMail.send({
      to: user.email,
      from: "noreply@mycontractdoctors.com",
      subject: "Confirm account deactivation — My Contract Doctors",
      text: `You requested to deactivate your My Contract Doctors account. Open this link within 20 minutes to review and confirm: ${confirmationUrl.toString()}\n\nYou must sign in to the same account to confirm. Your uploaded documents and analyses will be retained while a retention policy is finalized. If you did not request this, you can ignore this email.`,
    });
  } catch {
    await admin.from("account_deactivation_challenges").delete().eq("user_id", user.id).eq("token_hash", tokenHash);
    return NextResponse.json({ error: "Could not send the confirmation email. Please try again." }, { status: 503, headers });
  }
  return NextResponse.json({ ok: true }, { headers });
}
