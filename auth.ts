import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          // Calendars.Read powers Phase 4. offline_access keeps refresh tokens.
          scope: "openid profile email offline_access User.Read Calendars.Read",
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
