import Link from "next/link";
import { cookies } from "next/headers";
import AuthShell from "@/components/auth/AuthShell";
import { recoveryCookie, validRecoveryGrant } from "@/lib/account/recovery-grant";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const token = (await cookies()).get(recoveryCookie)?.value;
  const allowed = Boolean(user && process.env.SUPABASE_SERVICE_ROLE_KEY && validRecoveryGrant(token, user.id, process.env.SUPABASE_SERVICE_ROLE_KEY));
  return <AuthShell eyebrow="Account recovery" title={allowed ? "Choose a new password" : "Reset link unavailable"}>
    {allowed ? <ResetPasswordForm /> : <div className="font-sans text-sm text-gray-600">
      This reset link is missing, expired, or no longer valid. <Link href="/forgot-password" className="text-blue">Request another link</Link>.
    </div>}
  </AuthShell>;
}
