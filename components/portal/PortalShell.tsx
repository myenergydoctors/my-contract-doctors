"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mockUser } from "@/lib/mock-data";
import { isSignedIn, signOut } from "@/lib/demo-auth";

const nav = [
  { label: "Overview",      href: "/dashboard",               icon: "▦" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "◔", badge: "2" },
  { label: "Invoices",      href: "/dashboard/invoices",      icon: "▤" },
  { label: "Agreements",    href: "/dashboard/agreements",    icon: "▥" },
  { label: "Insights",      href: "/dashboard/insights",      icon: "◬", badge: "Pro" },
  { label: "Modules",       href: "/dashboard/modules",       icon: "◫" },
  { label: "Billing",       href: "/dashboard/billing",       icon: "◉" },
  { label: "Settings",      href: "/dashboard/settings",      icon: "◐" },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Demo auth gate. Replace with real Supabase session check in Phase 2.
  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/sign-in");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    signOut();
    router.push("/sign-in");
  };

  // Don't flash dashboard content while we're checking
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="font-sans text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  const currentPage = nav.find(n => n.href === pathname) || nav.find(n => n.href !== "/dashboard" && pathname?.startsWith(n.href)) || nav[0];

  return (
    <div className="min-h-screen flex bg-off-white">

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-dark border-r border-white/5 fixed inset-y-0 left-0 z-40">
        <SidebarContent pathname={pathname} closeMobile={() => setMobileOpen(false)} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-navy-dark border-r border-white/5">
            <SidebarContent pathname={pathname} closeMobile={() => setMobileOpen(false)} />
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
                  {mockUser.avatarInitials}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-sans text-sm font-medium text-navy leading-tight">{mockUser.name}</div>
                  <div className="font-sans text-xs text-gray-500 leading-tight">{mockUser.businessName}</div>
                </div>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-sans text-sm font-medium text-navy">{mockUser.name}</div>
                      <div className="font-sans text-xs text-gray-500 truncate">{mockUser.email}</div>
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
        <div className="bg-amber/10 border-b border-amber/30 px-5 md:px-8 py-2 flex items-center gap-2 text-xs">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-amber text-white px-2 py-0.5 rounded">Preview</span>
          <span className="font-sans text-amber-700">Sample data shown. Real account uploads and analyses are coming.</span>
        </div>

        {/* Page content */}
        <main className="flex-1 px-5 md:px-8 py-6 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, closeMobile }: { pathname: string | null; closeMobile: () => void }) {
  return (
    <>
      {/* Brand */}
      <div className="px-6 h-16 flex items-center border-b border-white/5">
        <Link href="/dashboard" onClick={closeMobile} className="no-underline flex flex-col leading-none">
          <span className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-blue-light">My</span>
          <div className="flex items-baseline">
            <span className="font-serif text-[18px] text-white">Contract&nbsp;</span>
            <span className="font-serif italic text-[18px] text-blue-light">Doctors</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map(({ label, href, icon, badge }) => {
          const active = href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 font-sans text-sm no-underline transition-colors ${
                active
                  ? "bg-blue/20 text-white"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-lg leading-none w-5 text-center">{icon}</span>
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-teal/20 text-teal px-2 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan card */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-1">Current plan</div>
          <div className="font-serif text-white text-lg mb-2 capitalize">{mockUser.plan}</div>
          <Link href="/dashboard/billing" onClick={closeMobile} className="block font-sans text-xs text-blue-light hover:text-white no-underline">
            Manage plan →
          </Link>
        </div>
      </div>
    </>
  );
}
