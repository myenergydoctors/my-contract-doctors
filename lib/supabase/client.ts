"use client";
import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client. Use this in any "use client" component that needs
// to read user state, sign in, sign up, sign out, etc. The session is stored
// in cookies (set up by middleware) so this client is fully isomorphic with
// the server one.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
