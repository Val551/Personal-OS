import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // openid/email/profile = identity. calendar.readonly powers Phase 4.
          // access_type=offline + prompt=consent are required to get a
          // refresh_token from Google (otherwise the access_token dies in 1h
          // and can't be refreshed).
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
      // Single-user app: matching email links to the seeded User row so the
      // demo data is the user's data on first sign-in.
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          // repo gives access to private PR metadata (Phase 5).
          scope: "read:user user:email repo",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
});
