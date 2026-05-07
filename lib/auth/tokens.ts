import { prisma } from "@/lib/db";

export type Provider = "google" | "github";

const SAFETY_WINDOW_SECONDS = 60;

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

  if (provider === "google") {
    if (!account.refresh_token) return null;
    const refreshed = await refreshGoogleToken(account.refresh_token);
    if (!refreshed) return null;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: refreshed.access_token,
        expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      },
    });
    return refreshed.access_token;
  }

  // GitHub tokens don't expire by default.
  return account.access_token;
}

interface GoogleRefreshResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<GoogleRefreshResponse | null> {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  return (await res.json()) as GoogleRefreshResponse;
}
