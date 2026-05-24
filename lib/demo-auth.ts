// Temporary demo-only auth.
// Replace this entire file with real Supabase auth in Phase 2 of the portal build.
//
// Anything you change here (credentials, storage key, etc.) is a deploy-and-share moment —
// the password lives in the JS bundle and is visible to anyone who views source.
// That's acceptable for a stakeholder demo; do NOT use this for real user data.

export const DEMO_EMAIL = "demo@mycontractdoctors.com";
export const DEMO_PASSWORD = "MCD-Preview-2026";

const STORAGE_KEY = "mcd_demo_session";

export function signIn(email: string, password: string): { ok: true } | { ok: false; reason: string } {
  if (email.trim().toLowerCase() !== DEMO_EMAIL.toLowerCase()) {
    return { ok: false, reason: "No account found with that email." };
  }
  if (password !== DEMO_PASSWORD) {
    return { ok: false, reason: "Incorrect password." };
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  }
  return { ok: true };
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

// For onboarding / preview flows that should land the user inside the demo
// dashboard without entering credentials.
export function setDemoSession() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  }
}
