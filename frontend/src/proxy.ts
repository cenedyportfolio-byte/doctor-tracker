import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_ROUTES = new Set(["/login"]);
const HOME = "/dashboard";

/** Only allow same-site relative paths as post-login redirect targets. */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return null;
  return value;
}

/**
 * Route protection. Runs before any page renders: pages are only served to requests carrying
 * a valid, unexpired session token. The API independently authenticates and authorizes every
 * request, so this is the UX layer (no flash of protected UI), not the only line of defense.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (token) loginUrl.searchParams.set("expired", "1");

    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE); // expired or tampered
    return response;
  }

  if (session && (isPublic || pathname === "/")) {
    const target = safeNext(request.nextUrl.searchParams.get("next")) ?? HOME;
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the API proxy, Next.js internals and static files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
