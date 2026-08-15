import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

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
  const trustedOrigin = process.env.NODE_ENV === "development"
    ? request.nextUrl.origin
    : SITE.url;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, trustedOrigin));
    }
  }

  // Failure path — bounce back to sign-in with an error flag
  return NextResponse.redirect(new URL("/sign-in?error=auth-callback-failed", trustedOrigin));
}
