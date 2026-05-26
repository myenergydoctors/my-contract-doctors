"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/profiles";

// Returns the signed-in user's metadata (name, business, email) from Supabase.
// Prefers the profiles row (canonical), falls back to auth.user.user_metadata
// while the profile is being created or if the trigger hasn't run.
export type RealUser = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  business: string;
  initials: string;
};

export function useRealUser(): RealUser | null {
  const [user, setUser] = useState<RealUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled || !u) return;

      // Try profiles table first (canonical), fall back to auth metadata
      const profile = await getProfile();
      const meta = u.user_metadata || {};
      const first = (profile?.first_name || meta.first_name || "").trim();
      const last = (profile?.last_name || meta.last_name || "").trim();
      const business = (profile?.business_name || meta.business_name || "").trim();
      const initials = ((first[0] || "") + (last[0] || "")).toUpperCase() || (u.email?.[0]?.toUpperCase() ?? "?");

      if (cancelled) return;
      setUser({
        id: u.id,
        email: u.email ?? null,
        firstName: first || u.email?.split("@")[0] || "there",
        lastName: last,
        business: business || "Your business",
        initials: initials || "?",
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return user;
}
