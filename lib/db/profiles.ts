"use client";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow, Plan } from "@/lib/supabase/database.types";

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return data as ProfileRow;
}

export async function updateProfile(updates: Partial<Pick<ProfileRow, "first_name" | "last_name" | "business_name" | "industry">>): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
