import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config — no Prisma adapter, no Node-only APIs. Imported by
 * `middleware.ts` so the auth check runs in the Edge runtime.
 *
 * The full config (with Prisma adapter + providers) lives in `auth.ts` and
 * extends this one. See:
 *   https://authjs.dev/guides/edge-compatibility
 */
export default {
  providers: [],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      // Prefer token.uid (set by our custom callback), fall back to token.sub
      // (set automatically by NextAuth) so legacy cookies still resolve.
      const id = (token.uid as string | undefined) ?? token.sub;
      if (session.user && id) {
        session.user.id = id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
