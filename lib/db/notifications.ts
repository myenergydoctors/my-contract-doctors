"use client";
import { createClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@/lib/supabase/database.types";

export type NotificationForUI = {
  id: string;
  type: "renewal" | "analysis" | "savings" | "system" | "insight";
  title: string;
  body: string;
  href?: string;
  actionLabel?: string;
  unread: boolean;
  timestamp: string;
};

function toUI(row: NotificationRow): NotificationForUI {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    actionLabel: row.action_label ?? undefined,
    unread: row.unread,
    timestamp: relativeTime(row.created_at),
  };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minute${Math.floor(diffSec / 60) === 1 ? "" : "s"} ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hour${Math.floor(diffSec / 3600) === 1 ? "" : "s"} ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function listNotifications(): Promise<NotificationForUI[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as NotificationRow[]).map(toUI);
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from("notifications")
    .update({ unread: false })
    .eq("user_id", user.id)
    .eq("unread", true);
  return { ok: !error };
}
