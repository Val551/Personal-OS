import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/shell/AppShell";
import { StoreProvider } from "@/lib/store";
import {
  serializeMeeting,
  serializeNote,
  serializePR,
  serializeRecap,
  serializeTask,
} from "@/lib/serialize";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [tasksRaw, meetingsRaw, notesRaw, prsRaw, recapsRaw] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      include: { linkedNotes: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.meeting.findMany({
      where: { userId },
      include: { notes: { select: { id: true } }, tasks: { select: { id: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.note.findMany({
      where: { userId },
      include: { linkedTasks: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pullRequest.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.recap.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  const initialData = {
    tasks: tasksRaw.map(serializeTask),
    meetings: meetingsRaw.map(serializeMeeting),
    notes: notesRaw.map(serializeNote),
    prs: prsRaw.map(serializePR),
    recaps: recapsRaw.map(serializeRecap),
  };

  return (
    <StoreProvider initialData={initialData}>
      <AppShell session={session}>{children}</AppShell>
    </StoreProvider>
  );
}
