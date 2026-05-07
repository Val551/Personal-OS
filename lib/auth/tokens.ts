import { prisma } from "@/lib/db";

/**
 * Returns a valid access token for the given user + provider, refreshing the
 * stored token if it's expired or close to expiring. Used by Phase 4
 * (Microsoft Calendar sync) and Phase 5 (GitHub PR sync).
 *
 * For now this is a thin shell — the refresh logic is provider-specific and
 * lands when the sync jobs are wired up.
 */
export type Provider = "microsoft-entra-id" | "github";

const SAFETY_WINDOW_SECONDS = 60; // refresh if < 60s of life left

export async function getValidAccessToken(
  userId: string,
  provider: Provider,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider },
  });
  if (!account?.access_token) return null;

  const now = Math.floor(Date.now() / 1000);
  const stillValid =
    !account.expires_at || account.expires_at - now > SAFETY_WINDOW_SECONDS;

  if (stillValid) return account.access_token;

  // Refresh path stubbed — implement in Phase 4/5.
  // For Microsoft: POST to https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
  // For GitHub:    GitHub OAuth tokens don't expire by default.
  return account.access_token;
}
