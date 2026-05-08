"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "./_helpers";

const IANA_RE = /^[A-Za-z]+(?:[\/_+\-][A-Za-z0-9]+)*$/;

export async function updateTimezoneAction(timezone: string): Promise<void> {
  const userId = await requireUserId();
  if (!IANA_RE.test(timezone) || timezone.length > 64) return;
  await prisma.user.update({
    where: { id: userId },
    data: { timezone },
  });
}
