import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration used by the middleware.
 * Must NOT import Prisma, bcrypt, or any Node-only dependency —
 * the middleware bundle runs on the Edge runtime with a tight size limit.
 * The heavy Credentials provider (bcrypt + Prisma) lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: "operator" | "admin" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "operator" | "admin";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" || pathname.startsWith("/api/auth");
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
