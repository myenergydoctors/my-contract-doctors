import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Auth callback. Supabase redirects to /auth/callback?code=... after:
//   - Email confirmation click (sign-up)
//   - Magic-link click
//   - OAuth provider callback (Google/Microsoft/Apple)
// We exchange the code for a session, then send the user where they wanted
// to go (or /dashboard as fallback).

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the requested page after successful exchange
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Failure path — bounce back to sign-in with an error flag
  return NextResponse.redirect(`${origin}/sign-in?error=auth-callback-failed`);
}
