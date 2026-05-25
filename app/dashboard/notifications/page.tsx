"use client";
import Link from "next/link";
import { useEffectiveData } from "@/lib/use-effective-plan";
import EmptyState from "@/components/portal/EmptyState";

const typeMeta = {
  renewal:  { label: "Renewal alert",     bg: "bg-red-light",   text: "text-red",     icon: "⏰" },
  analysis: { label: "Analysis ready",    bg: "bg-teal-light",  text: "text-teal",    icon: "▤" },
  savings:  { label: "Savings unlocked",  bg: "bg-teal-light",  text: "text-teal",    icon: "$" },
  insight:  { label: "Industry insight",  bg: "bg-blue-pale",   text: "text-blue",    icon: "◬" },
  system:   { label: "System",            bg: "bg-gray-100",    text: "text-gray-500", icon: "○" },
} as const;

export default function NotificationsPage() {
  const { notifications: list } = useEffectiveData();
  const unreadCount = list.filter(n => n.unread).length;

  return (
    <div className="max-w-4xl">

      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="font-sans font-light text-gray-500 leading-relaxed">
            Renewal alerts, finished analyses, and updates from your contracts — all in one place.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="font-sans text-sm text-blue hover:text-navy bg-transparent border-none cursor-pointer whitespace-nowrap">
            Mark all read
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {["All", "Unread", "Renewals", "Analyses", "Savings", "Insights"].map((f, i) => (
          <button
            key={f}
            className={`font-sans text-sm px-4 py-1.5 rounded-full whitespace-nowrap border transition-colors cursor-pointer ${
              i === 0 ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-off-white"
            }`}
          >
            {f}{i === 1 && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <EmptyState
          illustration="bell"
          eyebrow="Quiet for now"
          title="No notifications yet."
          body="Once you upload your first invoice or contract, we'll start showing renewal alerts, analysis updates, and vendor responses here."
          primaryCta={{ label: "Upload an invoice →", href: "/invoice" }}
        />
      ) : (
      <div className="flex flex-col gap-3">
        {list.map(n => {
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {list.length > 0 && (
        <div className="text-center mt-10">
          <p className="font-sans text-sm text-gray-500">You're all caught up.</p>
        </div>
      )}
    </div>
  );
}
