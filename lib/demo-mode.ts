// Toggle between populated (demo) and empty-state views of the dashboard.
// Stored in localStorage so it persists across navigations within a session.
// Replace this with real "did this user upload anything yet?" logic when
// Supabase data lands.

const KEY = "mcd_demo_view_mode";

export type DemoMode = "populated" | "empty";

export function getDemoMode(): DemoMode {
  if (typeof window === "undefined") return "populated";
  return window.localStorage.getItem(KEY) === "empty" ? "empty" : "populated";
}

export function setDemoMode(mode: DemoMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
}
