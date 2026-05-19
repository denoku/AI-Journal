import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Check for NextAuth v5 session cookie (HTTP and HTTPS variants)
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  const isSigninPage = request.nextUrl.pathname === "/signin";

  if (!hasSession && !isSigninPage) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (hasSession && isSigninPage) {
    return NextResponse.redirect(new URL("/journal", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
