import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demystifierContent } from "./content";

export async function demystifierSnapshot(client?: Awaited<ReturnType<typeof createClient>>, adminFactory = createAdminClient) {
  const auth = client ?? await createClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (!user) {
    if (error && error.name !== "AuthSessionMissingError" && error.status !== 401 && error.status !== 403) throw new Error("Account verification unavailable");
    return { signedIn: false, access: false, ...demystifierContent(false) };
  }
  const admin = adminFactory();
  const profile = await admin.from("profiles").select("deactivated_at").eq("id", user.id).maybeSingle();
  if (profile.error) throw new Error("Account verification unavailable");
  if (!profile.data || profile.data.deactivated_at || !user.email_confirmed_at) return { signedIn: true, access: false, ...demystifierContent(false) };
  const entitlement = await admin.from("billing_entitlements").select("id").eq("user_id", user.id).eq("product_code", "demystifier").eq("active", true).is("revoked_at", null).is("resource_id", null).neq("source_provider", "staging").limit(1);
  if (entitlement.error) throw new Error("Access verification unavailable");
  const access = !!entitlement.data?.length;
  return { signedIn: true, access, ...demystifierContent(access) };
}
