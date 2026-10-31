"use client";
import Link from "next/link";
import { useState } from "react";
import { useEffectiveData } from "@/lib/use-effective-plan";
import { markNotificationsRead } from "@/lib/db/notifications";
import EmptyState from "@/components/portal/EmptyState";

const typeMeta = {
  renewal:  { label: "Renewal alert",     bg: "bg-red-light",   text: "text-red",     icon: "⏰" },
  analysis: { label: "Analysis ready",    bg: "bg-teal-light",  text: "text-teal",    icon: "▤" },
  savings:  { label: "Savings unlocked",  bg: "bg-teal-light",  text: "text-teal",    icon: "$" },
  insight:  { label: "Industry insight",  bg: "bg-blue-pale",   text: "text-blue",    icon: "◬" },
  system:   { label: "System",            bg: "bg-gray-100",    text: "text-gray-500", icon: "○" },
} as const;

export default function NotificationsPage() {
  const { notifications, notificationsError, mode, loading } = useEffectiveData();
  const [filter, setFilter] = useState("All");
  const [previewRead, setPreviewRead] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const list = notifications.map(item => mode !== "live" && previewRead.includes(item.id) ? { ...item, unread: false } : item);
  const unreadCount = list.filter(n => n.unread).length;
  const filterTypes: Record<string, string> = { Renewals: "renewal", Analyses: "analysis", Savings: "savings", Insights: "insight" };
  const visible = list.filter(item => filter === "All" || (filter === "Unread" ? item.unread : item.type === filterTypes[filter]));
  const markRead = async (id?: string) => {
    if (saving) return;
    setSaving(true); setError("");
    try {
      if (mode === "live") {
        if (!(await markNotificationsRead(id)).ok) throw new Error("Your read status could not be saved. Please retry.");
      } else setPreviewRead(current => [...new Set([...current, ...(id ? [id] : list.map(item => item.id))])]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your read status could not be saved. Please retry."); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">

      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="font-sans font-light text-gray-500 leading-relaxed">
            Saved analysis updates and enabled renewal reminders appear here. <Link href="/dashboard/reminders" className="text-blue">Manage deadlines and email preferences →</Link>
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => void markRead()} disabled={saving} className="font-sans text-sm text-blue hover:text-navy bg-transparent border-none cursor-pointer whitespace-nowrap disabled:opacity-50">
            Mark all read
          </button>
        )}
      </div>
      {error && <p role="alert" className="font-sans text-sm text-red mb-4">{error}</p>}
      {notificationsError && <p role="alert" className="font-sans text-sm text-red mb-4">{notificationsError} <button onClick={() => window.location.reload()} className="underline cursor-pointer">Retry</button></p>}

      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {["All", "Unread", "Renewals", "Analyses", "Savings", "Insights"].map((f, i) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`font-sans text-sm px-4 py-1.5 rounded-full whitespace-nowrap border transition-colors cursor-pointer ${
              filter === f ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-off-white"
            }`}
          >
            {f}{i === 1 && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <p role="status" className="font-sans text-sm text-gray-500">Loading notifications…</p> : notificationsError ? null : visible.length === 0 ? (
        <EmptyState
          illustration="bell"
          eyebrow="Quiet for now"
          title={list.length ? "No notifications match this filter." : "No notifications yet."}
          body="Saved analysis updates will appear here when an invoice or agreement finishes processing."
          primaryCta={{ label: "Upload an invoice →", href: "/invoice" }}
        />
      ) : (
      <div className="flex flex-col gap-3">
        {visible.map(n => {
          const meta = typeMeta[n.type];
          return (
            <div key={n.id} className={`bg-white border rounded-2xl p-5 md:p-6 ${n.unread ? "border-blue/30 shadow-sm" : "border-gray-200"}`}>
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center text-lg flex-shrink-0`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${meta.bg} ${meta.text}`}>
                      {meta.label}
                    </span>
                    <span className="font-sans text-xs text-gray-500">{n.timestamp}</span>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-blue" />}
                  </div>
                  <h3 className="font-serif text-navy text-base md:text-lg leading-snug mb-1.5">{n.title}</h3>
                  <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-3">{n.body}</p>
                  {n.href && n.actionLabel && (
                    <Link href={n.href} className="font-sans text-sm font-medium text-blue hover:text-navy no-underline">
                      {n.actionLabel} →
                    </Link>
                  )}
                  {n.unread && <button onClick={() => void markRead(n.id)} disabled={saving} className="block mt-3 font-sans text-xs text-blue hover:text-navy cursor-pointer disabled:opacity-50">Mark as read</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {list.length > 0 && unreadCount === 0 && (
        <div className="text-center mt-10">
          <p className="font-sans text-sm text-gray-500">You're all caught up.</p>
        </div>
      )}
    </div>
  );
}
