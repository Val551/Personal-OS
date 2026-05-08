import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";

const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

async function readSignedInUserId(): Promise<string | null> {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const decoded = await decode({
      token,
      secret: process.env.AUTH_SECRET!,
      salt: SESSION_COOKIE,
    });
    return (decoded?.uid ?? decoded?.sub ?? null) as string | null;
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Force-links a second OAuth provider to the currently-signed-in user
     * regardless of email match. Runs AFTER the adapter has created the
     * (potentially duplicate) user + account rows, so the merge can safely
     * read and delete them. Without this, OAuthing into provider B while
     * signed in via provider A would replace the session with a brand-new
     * user instead of linking.
     */
    async jwt({ token, user, account }) {
      // Fires on first sign-in (user is set). Provider type may be "oauth"
      // (GitHub) or "oidc" (Google) — both need linking + token.uid set.
      if (user && account) {
        const existingUserId = await readSignedInUserId();
        const newUserId = user.id;

        if (existingUserId && newUserId && existingUserId !== newUserId) {
          try {
            const [existingUser, newUser] = await Promise.all([
              prisma.user.findUnique({ where: { id: existingUserId } }),
              prisma.user.findUnique({ where: { id: newUserId } }),
            ]);

            if (existingUser && newUser) {
              const alreadyLinked = await prisma.account.findFirst({
                where: {
                  userId: existingUserId,
                  provider: account.provider,
                },
              });

              if (alreadyLinked) {
                // Refresh tokens on existing link, drop the duplicate
                // user (cascade removes the new Account row too).
                await prisma.account.update({
                  where: { id: alreadyLinked.id },
                  data: {
                    access_token: account.access_token as string | null,
                    refresh_token:
                      (account.refresh_token as string | null) ??
                      alreadyLinked.refresh_token,
                    expires_at: account.expires_at as number | null,
                    token_type: account.token_type as string | null,
                    scope: account.scope as string | null,
                    id_token: account.id_token as string | null,
                  },
                });
                await prisma.user.delete({ where: { id: newUserId } });
              } else {
                // Move the just-created Account row to the existing user,
                // then delete the now-orphaned duplicate user.
                await prisma.account.updateMany({
                  where: {
                    userId: newUserId,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                  data: { userId: existingUserId },
                });
                await prisma.user.delete({ where: { id: newUserId } });
              }

              token.uid = existingUserId;
              token.sub = existingUserId;
              return token;
            }
          } catch (err) {
            console.error("[jwt] Account linking failed:", err);
          }
        }

        token.uid = newUserId;
        return token;
      }

      return token;
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
});
