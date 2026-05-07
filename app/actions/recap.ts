"use server";

import { prisma } from "@/lib/db";
import { serializeRecap } from "@/lib/serialize";
import type { Recap } from "@/lib/types";
import { requireUserId } from "./_helpers";

export interface SaveRecapInput {
  date: string;
  accomplishments: string;
  blockers: string;
  topThree: string;
  carryOver: string;
}

export async function saveRecapAction(input: SaveRecapInput): Promise<Recap> {
  const userId = await requireUserId();
  const saved = await prisma.recap.upsert({
    where: { userId_date: { userId, date: input.date } },
    update: {
      accomplishments: input.accomplishments,
      blockers: input.blockers,
      topThree: input.topThree,
      carryOver: input.carryOver,
    },
    create: {
      userId,
      date: input.date,
      accomplishments: input.accomplishments,
      blockers: input.blockers,
      topThree: input.topThree,
      carryOver: input.carryOver,
    },
  });
  return serializeRecap(saved);
}
