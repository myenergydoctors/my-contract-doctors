import Link from "next/link";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import DeactivationConfirm from "./DeactivationConfirm";

function isUnexpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) > Date.now();
}

export default async function DeactivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let valid = false;
  let lookupFailed = false;
  if (user && token && /^[a-f0-9]{64}$/.test(token)) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const admin = createAdminClient();
    const { data, error } = await admin.from("account_deactivation_challenges")
      .select("expires_at,consumed_at")
      .eq("user_id", user.id).eq("token_hash", tokenHash).maybeSingle();
    lookupFailed = Boolean(error);
    valid = Boolean(data && !data.consumed_at && isUnexpired(data.expires_at));
  }
  return <div className="min-h-screen bg-off-white px-6 py-16 flex items-center justify-center">
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="font-serif text-navy text-3xl mb-4">Deactivate your account</h1>
      {valid && token ? <>
        <p className="font-sans text-sm text-gray-600 leading-relaxed mb-4">Confirming blocks access to your dashboard and new file requests. Your uploaded contracts, invoices, analyses, and billing preview records remain stored. No files are deleted. File links you opened earlier may work for up to 10 minutes.</p>
        <p className="font-sans text-sm text-gray-600 leading-relaxed mb-6">To ask about reactivation or your stored data, contact <a href={`mailto:${SITE.email}`} className="text-blue">{SITE.email}</a>.</p>
        <DeactivationConfirm token={token} />
      </> : lookupFailed ? <p className="font-sans text-sm text-gray-600">We could not check this link right now. Please reload and try again.</p>
        : <p className="font-sans text-sm text-gray-600">This confirmation link is invalid, expired, or already used. <Link href="/dashboard/settings" className="text-blue">Return to Settings</Link> to request another.</p>}
    </div>
  </div>;
}
