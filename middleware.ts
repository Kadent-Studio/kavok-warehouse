import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight Edge gate.
 *
 * We deliberately do NOT import next-auth here: pulling in @auth/core + jose
 * pushes the Edge bundle past Vercel's 1 MB limit (Hobby plan). Instead the
 * middleware only checks for the presence of the session cookie to redirect
 * unauthenticated visitors early.
 *
 * This is a UX gate, not the security boundary — real session verification
 * happens server-side in app/(app)/layout.tsx via auth() on the Node runtime,
 * so a forged or expired cookie never grants access to data.
 */
const SESSION_COOKIE_PREFIXES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

export function middleware(request: NextRequest) {
  const hasSession = request.cookies
    .getAll()
    .some((cookie) =>
      SESSION_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix))
    );

  if (!hasSession) {
    const loginUrl = new URL("/login", request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
