"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Returns the signed-in user's metadata (name, business, email) from Supabase.
// Falls back to null while loading or if no session. Used by client components
// in the portal to show real user info instead of the mockUser.
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
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (cancelled || !u) return;
      const meta = u.user_metadata || {};
      const first = (meta.first_name || "").trim();
      const last = (meta.last_name || "").trim();
      const business = (meta.business_name || "").trim();
      const initials = ((first[0] || "") + (last[0] || "")).toUpperCase() || (u.email?.[0]?.toUpperCase() ?? "?");
      setUser({
        id: u.id,
        email: u.email ?? null,
        firstName: first || u.email?.split("@")[0] || "there",
        lastName: last,
        business: business || "Your business",
        initials: initials || "?",
      });
    });
    return () => { cancelled = true; };
  }, []);

  return user;
}
