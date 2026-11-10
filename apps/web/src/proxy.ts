import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast redirect for signed-out visitors to /admin. This only checks that a session cookie
 * exists; the API verifies the token on every admin request.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!req.cookies.has("psh_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
