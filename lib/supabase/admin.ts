import "server-only";

import { createClient } from "@supabase/supabase-js";

// Server-side admin client using the SERVICE_ROLE key. Bypasses RLS — use
// ONLY in server routes / server actions for operations that legitimately
// need to act on behalf of the system (e.g., reading files uploaded by a
// user via storage policies, inserting extraction job records).
//
// NEVER import this from a client component. NEVER expose this client to
// the browser. Verify the calling user's identity yourself with the
// server-side auth client BEFORE using this admin client.

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
