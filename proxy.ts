import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Proxy performs optimistic navigation redirects and refreshes the Supabase
// session cookie. Protected data and mutations must still enforce
// authorization in their server-side data-access path.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - public metadata assets
     * - API routes (they enforce their own authorization)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|icon\\.svg|opengraph-image|api).*)",
  ],
};
