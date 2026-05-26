"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mockUser, mockNotifications } from "@/lib/mock-data";
import { getDemoMode, setDemoMode, planForMode, demoModes, type DemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

type NavItem = { label: string; href: string; icon: string; badge?: string; badgeKind?: "count" | "pro" };

function buildNav(opts: { unreadNotifications: number; effectivePlan: string }): NavItem[] {
  const items: NavItem[] = [
    { label: "Overview",      href: "/dashboard",               icon: "▦" },
    { label: "Notifications", href: "/dashboard/notifications", icon: "◔" },
    { label: "Invoices",      href: "/dashboard/invoices",      icon: "▤" },
    { label: "Agreements",    href: "/dashboard/agreements",    icon: "▥" },
    { label: "Insights",      href: "/dashboard/insights",      icon: "◬" },
    { label: "Modules",       href: "/dashboard/modules",       icon: "◫" },
    { label: "Billing",       href: "/dashboard/billing",       icon: "◉" },
    { label: "Settings",      href: "/dashboard/settings",      icon: "◐" },
  ];
  if (opts.unreadNotifications > 0) {
    const n = items.find(i => i.href === "/dashboard/notifications");
    if (n) { n.badge = String(opts.unreadNotifications); n.badgeKind = "count"; }
  }
  if (opts.effectivePlan !== "pro") {
    const ins = items.find(i => i.href === "/dashboard/insights");
    if (ins) { ins.badge = "Pro"; ins.badgeKind = "pro"; }
  }
  return items;
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState<DemoMode>("pro");
  const [realUser, setRealUser] = useState<{ email: string | null; firstName: string; lastName: string; business: string; initials: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setMode(getDemoMode());
  }, []);

  useEffect(() => {
    // Load real Supabase user metadata if signed in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata || {};
        const first = (meta.first_name || "").trim();
        const last = (meta.last_name || "").trim();
        const business = (meta.business_name || "").trim();
        const initials = ((first[0] || "") + (last[0] || "")).toUpperCase() || (user.email?.[0]?.toUpperCase() ?? "?");
        setRealUser({
          email: user.email ?? null,
          firstName: first || user.email?.split("@")[0] || "there",
          lastName: last,
          business: business || "Your business",
          initials: initials || "?",
        });
      }
    });
  }, [supabase]);

  const switchMode = (next: DemoMode) => {
    if (next === mode) return;
    setDemoMode(next);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const effectivePlan = planForMode(mode);
  // Notification visibility mirrors useEffectiveData logic in lib/use-effective-plan
  const visibleNotifications = (() => {
    if (mode === "new") return [];
    if (mode === "free") return mockNotifications.filter(n => n.type === "analysis" || n.type === "system").slice(0, 2);
    if (mode === "agreement") return mockNotifications.filter(n => n.type !== "insight").slice(0, 4);
    return mockNotifications;
  })();
  const unreadCount = visibleNotifications.filter(n => n.unread).length;
  const navItems = buildNav({ unreadNotifications: unreadCount, effectivePlan });

  // Middleware already gates /dashboard/* via Supabase session — if we got
  // rendered, the user is signed in. Skip the localStorage check entirely.
  useEffect(() => {
    setAuthChecked(true);
  }, []);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  // Don't flash dashboard content while we're checking
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="font-sans text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  const currentPage = navItems.find(n => n.href === pathname) || navItems.find(n => n.href !== "/dashboard" && pathname?.startsWith(n.href)) || navItems[0];

  return (
    <div className="min-h-screen flex bg-off-white">

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-dark border-r border-white/5 fixed inset-y-0 left-0 z-40">
        <SidebarContentInner closeMobile={() => setMobileOpen(false)} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-navy-dark border-r border-white/5">
            <SidebarContentInner closeMobile={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-9 h-9 flex flex-col justify-center items-center gap-[5px] bg-transparent border-none cursor-pointer"
            >
              <span className="block w-5 h-[2px] bg-navy" />
              <span className="block w-5 h-[2px] bg-navy" />
              <span className="block w-5 h-[2px] bg-navy" />
            </button>
            <h1 className="font-serif text-navy text-xl md:text-2xl truncate">{currentPage.label}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoice"
              className="hidden sm:inline-flex items-center font-sans text-sm font-medium bg-teal text-white px-4 py-2 rounded-lg no-underline hover:opacity-90 transition-opacity"
            >
              + Upload
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-pale text-blue font-sans text-sm font-semibold flex items-center justify-center">
                  {realUser?.initials || mockUser.avatarInitials}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-sans text-sm font-medium text-navy leading-tight">
                    {realUser ? `${realUser.firstName} ${realUser.lastName}`.trim() : mockUser.name}
                  </div>
                  <div className="font-sans text-xs text-gray-500 leading-tight">{realUser?.business || mockUser.businessName}</div>
                </div>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-sans text-sm font-medium text-navy">
                        {realUser ? `${realUser.firstName} ${realUser.lastName}`.trim() : mockUser.name}
                      </div>
                      <div className="font-sans text-xs text-gray-500 truncate">{realUser?.email || mockUser.email}</div>
                    </div>
                    <Link href="/dashboard/settings" className="block px-4 py-2.5 font-sans text-sm text-gray-700 hover:bg-off-white no-underline" onClick={() => setUserMenuOpen(false)}>Account settings</Link>
                    <Link href="/dashboard/billing"  className="block px-4 py-2.5 font-sans text-sm text-gray-700 hover:bg-off-white no-underline" onClick={() => setUserMenuOpen(false)}>Billing</Link>
                    <Link href="/"                   className="block px-4 py-2.5 font-sans text-sm text-gray-700 hover:bg-off-white no-underline border-t border-gray-100" onClick={() => setUserMenuOpen(false)}>Back to site</Link>
                    <a href="/sign-in" onClick={handleSignOut} className="block px-4 py-2.5 font-sans text-sm text-red hover:bg-off-white no-underline border-t border-gray-100 cursor-pointer">Sign out</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Demo notice — remove once real Supabase auth + DB are wired */}
        <div className="bg-amber/10 border-b border-amber/30 px-5 md:px-8 py-2 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-amber text-white px-2 py-0.5 rounded flex-shrink-0">Preview</span>
            <span className="font-sans text-amber-700 truncate hidden sm:inline">View as:</span>
          </div>
          <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {demoModes.map(m => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                title={m.description}
                className={`font-sans text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  mode === m.id
                    ? "bg-amber text-white"
                    : "bg-white border border-amber/30 text-amber-700 hover:bg-amber/20"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-5 md:px-8 py-6 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );

  function SidebarContentInner({ closeMobile }: { closeMobile: () => void }) {
    return (
      <>
        {/* Brand */}
        <div className="px-6 h-16 flex items-center border-b border-white/5">
          <Logo href="/dashboard" variant="dark-bg" size="sm" onClick={closeMobile} />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map(({ label, href, icon, badge, badgeKind }) => {
            const active = href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
            const badgeClasses = badgeKind === "count"
              ? "bg-red text-white"
              : badgeKind === "pro"
                ? "bg-teal/20 text-teal"
                : "bg-teal/20 text-teal";
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 font-sans text-sm no-underline transition-colors ${
                  active ? "bg-blue/20 text-white" : "text-white/65 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-lg leading-none w-5 text-center">{icon}</span>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badgeClasses}`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan card */}
        <div className="p-4 border-t border-white/5">
          {effectivePlan === "free" ? (
            <div className="bg-gradient-to-br from-teal to-blue rounded-xl p-4">
              <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-white/80 mb-1">Free plan</div>
              <div className="font-serif text-white text-base leading-tight mb-2">Unlock everything for $29/mo</div>
              <Link href="/dashboard/billing" onClick={closeMobile} className="block font-sans text-xs font-medium bg-white text-navy px-3 py-1.5 rounded text-center no-underline hover:opacity-90 transition-opacity">
                Upgrade to Pro →
              </Link>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-1">Current plan</div>
              <div className="font-serif text-white text-lg mb-2 capitalize">{effectivePlan}</div>
              <Link href="/dashboard/billing" onClick={closeMobile} className="block font-sans text-xs text-blue-light hover:text-white no-underline">
                Manage plan →
              </Link>
            </div>
          )}
        </div>
      </>
    );
  }
}
