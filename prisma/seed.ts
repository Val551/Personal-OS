/**
 * Prisma seed runner.
 *
 * Reuses the same fixture builder the prototype used (lib/mock/seed.ts) so the
 * dev DB matches the in-memory demo state exactly. Idempotent — wipes user-
 * scoped data and reinserts on every run.
 *
 * Run via: `npx prisma db seed`
 */
import { PrismaClient, type PRBucket } from "@prisma/client";
import { buildSeed } from "../lib/mock/seed";

const prisma = new PrismaClient();

const DEMO_EMAIL = "fabiocam@andrew.cmu.edu";
const DEMO_NAME = "Fabio Campos";

// The TS literal "review-requested" can't be a Prisma enum identifier
// (hyphens aren't valid). Map to the underscore form here.
function mapBucket(bucket: string): PRBucket {
  return (bucket === "review-requested" ? "review_requested" : bucket) as PRBucket;
}

async function main() {
  // Find or create the demo user. Using upsert keeps re-seeding safe.
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_NAME },
    create: { email: DEMO_EMAIL, name: DEMO_NAME },
  });

  // Wipe everything owned by this user. Cascade deletes via FK rules.
  await prisma.recap.deleteMany({ where: { userId: user.id } });
  await prisma.pullRequest.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.meeting.deleteMany({ where: { userId: user.id } });

  const seed = buildSeed();

  // Meetings first — tasks and notes link back to them by id.
  for (const m of seed.meetings) {
    await prisma.meeting.create({
      data: {
        id: m.id,
        userId: user.id,
        title: m.title,
        startAt: new Date(m.startAt),
        endAt: new Date(m.endAt),
        location: m.location,
        attendees: m.attendees,
        description: m.description,
        workspace: m.workspace,
      },
    });
  }

  // Notes next — created without M2M links so tasks can connect later.
  for (const n of seed.notes) {
    await prisma.note.create({
      data: {
        id: n.id,
        userId: user.id,
        title: n.title,
        body: n.body,
        type: n.type,
        linkedMeetingId: n.linkedMeetingId,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      },
    });
  }

  // Tasks — connect linkedNotes via implicit M2M.
  for (const t of seed.tasks) {
    await prisma.task.create({
      data: {
        id: t.id,
        userId: user.id,
        title: t.title,
        notes: t.notes,
        workspace: t.workspace,
        priority: t.priority,
        status: t.status,
        dueAt: t.dueAt ? new Date(t.dueAt) : undefined,
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        linkedMeetingId: t.linkedMeetingId,
        linkedNotes: t.linkedNoteIds.length
          ? { connect: t.linkedNoteIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  // Inverse direction of the Task ↔ Note M2M (notes that point to tasks).
  for (const n of seed.notes) {
    if (n.linkedTaskIds.length) {
      await prisma.note.update({
        where: { id: n.id },
        data: {
          linkedTasks: { connect: n.linkedTaskIds.map((id) => ({ id })) },
        },
      });
    }
  }

  for (const p of seed.prs) {
    await prisma.pullRequest.create({
      data: {
        id: p.id,
        userId: user.id,
        number: p.number,
        repo: p.repo,
        title: p.title,
        state: p.state,
        bucket: mapBucket(p.bucket),
        author: p.author,
        reviewers: p.reviewers,
        htmlUrl: p.htmlUrl,
        additions: p.additions,
        deletions: p.deletions,
        comments: p.comments,
        ciStatus: p.ciStatus,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
  }

  for (const r of seed.recaps) {
    await prisma.recap.create({
      data: {
        id: r.id,
        userId: user.id,
        date: r.date,
        accomplishments: r.accomplishments,
        blockers: r.blockers,
        topThree: r.topThree,
        carryOver: r.carryOver,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
    });
  }

  const counts = await Promise.all([
    prisma.meeting.count({ where: { userId: user.id } }),
    prisma.task.count({ where: { userId: user.id } }),
    prisma.note.count({ where: { userId: user.id } }),
    prisma.pullRequest.count({ where: { userId: user.id } }),
    prisma.recap.count({ where: { userId: user.id } }),
  ]);

  console.log(`Seeded user ${user.email}`);
  console.log(`  meetings:  ${counts[0]}`);
  console.log(`  tasks:     ${counts[1]}`);
  console.log(`  notes:     ${counts[2]}`);
  console.log(`  PRs:       ${counts[3]}`);
  console.log(`  recaps:    ${counts[4]}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
