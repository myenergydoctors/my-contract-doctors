import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Middleware Supabase client + session refresh. Called from middleware.ts at
// the app root on every request. Refreshes the session cookie if it's about
// to expire, and (optionally) enforces auth gates on protected routes.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the auth token if needed. Do not remove.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Gate the portal: unauthenticated users hitting /dashboard/* go to /sign-in
  if (path.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // If a signed-in user lands on auth pages, send them home
  if ((path === "/sign-in" || path === "/sign-up") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
