import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { createRecoveryGrant, recoveryCookie } from "@/lib/account/recovery-grant";

// Auth callback. Supabase redirects to /auth/callback?code=... after:
//   - Email confirmation click (sign-up)
//   - Magic-link click
//   - OAuth provider callback (Google/Microsoft/Apple)
// We exchange the code for a session, then send the user where they wanted
// to go (or /dashboard as fallback).

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedPath = searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";
  const allowedOrigins = new Set([
    SITE.url,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
  ]);
  if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)) {
    allowedOrigins.add(request.nextUrl.origin);
  }
  const trustedOrigin = allowedOrigins.has(request.nextUrl.origin) ? request.nextUrl.origin : SITE.url;
  const destination = new URL(nextPath, trustedOrigin);
  if (destination.origin !== trustedOrigin) destination.href = new URL("/dashboard", trustedOrigin).href;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(destination);
      if (searchParams.get("intent") === "password-recovery" && destination.pathname === "/reset-password" && data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        response.cookies.set(recoveryCookie, createRecoveryGrant(data.user.id, process.env.SUPABASE_SERVICE_ROLE_KEY), {
          httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60,
        });
      }
      return response;
    }
  }

  // Failure path — bounce back to sign-in with an error flag
  return NextResponse.redirect(new URL("/sign-in?error=auth-callback-failed", trustedOrigin));
}
