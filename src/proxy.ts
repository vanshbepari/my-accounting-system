/**
 * proxy.ts  (Next.js 16+ — replaces the deprecated middleware.ts)
 *
 * Runs at the edge BEFORE any page renders.
 * - Adds no-cache headers to all /dashboard/* routes so browsers and CDNs
 *   never serve a cached authenticated page to an unauthenticated user.
 * - Supabase uses localStorage (browser-only), so we cannot read the session
 *   server-side here. The client-side guard in dashboard/layout.tsx handles
 *   the actual redirect. This proxy ensures protected pages are never cached.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply special handling to protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const response = NextResponse.next();

    // Prevent caching of ALL protected pages — no CDN/browser should store
    // an authenticated page and serve it to a different (logged-out) user
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico   (browser icon)
     * - Public static files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
