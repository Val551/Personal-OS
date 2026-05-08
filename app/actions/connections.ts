"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { requireUserId } from "./_helpers";

export async function connectProviderAction(provider: "google" | "github") {
  await signIn(provider, { redirectTo: "/settings" });
}

export async function disconnectProviderAction(
  provider: "google" | "github",
): Promise<{ ok: boolean; reason?: string }> {
  const userId = await requireUserId();

  const accounts = await prisma.account.findMany({ where: { userId } });
  if (accounts.length <= 1) {
    return {
      ok: false,
      reason:
        "Can't disconnect the only sign-in method. Connect another provider first.",
    };
  }

  await prisma.account.deleteMany({ where: { userId, provider } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function disconnectGoogle() {
  const result = await disconnectProviderAction("google");
  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.reason ?? "error")}`);
  }
  redirect("/settings");
}

export async function disconnectGitHub() {
  const result = await disconnectProviderAction("github");
  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.reason ?? "error")}`);
  }
  redirect("/settings");
}
