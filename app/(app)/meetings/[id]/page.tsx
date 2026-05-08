"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ListPlus,
  MapPin,
  NotebookPen,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WORKSPACE_META, type Priority } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { meetings, notes, tasks, createNote, createTask } = useStore();

  const meeting = useMemo(() => meetings.find((m) => m.id === id), [meetings, id]);
  const meetingNotes = useMemo(
    () => notes.filter((n) => n.linkedMeetingId === id),
    [notes, id],
  );
  const meetingTasks = useMemo(
    () => tasks.filter((t) => t.linkedMeetingId === id),
    [tasks, id],
  );

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("med");
  const [noteBody, setNoteBody] = useState("");

  if (!meeting) {
    return (
      <div className="mx-auto max-w-2xl pt-20 text-center">
        <p className="text-[12px] text-muted-foreground">Meeting not found.</p>
        <Link
          href="/meetings"
          className="mt-3 inline-flex items-center gap-1 font-mono text-[12px] text-amber"
        >
          ← back to meetings
        </Link>
      </div>
    );
  }

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      workspace: meeting.workspace,
      linkedMeetingId: meeting.id,
    });
    setTaskTitle("");
  };

  const handleCreateNote = () => {
    if (!noteBody.trim()) return;
    createNote({
      title: `Notes — ${meeting.title}`,
      body: noteBody.trim(),
      type: "general",
      linkedMeetingId: meeting.id,
    });
    setNoteBody("");
  };

  const start = new Date(meeting.startAt);
  const end = new Date(meeting.endAt);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <button
        onClick={() => router.push("/meetings")}
        className="group inline-flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        all meetings
      </button>

      <header className="animate-fade-up">
        <p className="comment-label">{format(start, "EEEE LLL d, yyyy")}</p>
        <h1 className="mt-1 font-display text-[42px] leading-[1.0] tracking-tight-display text-ink">
          {meeting.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-ink-dim" />
            {format(start, "HH:mm")} → {format(end, "HH:mm")}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-dim" />
              {meeting.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-ink-dim" />
            {meeting.attendees.length} attendees
          </span>
          <Badge dot dotColor={WORKSPACE_META[meeting.workspace].color}>
            {WORKSPACE_META[meeting.workspace].label}
          </Badge>
        </div>
      </header>

      {meeting.description && (
        <Surface className="p-5 animate-fade-up stagger-1">
          <p className="comment-label mb-2">agenda</p>
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-muted">
            {meeting.description}
          </p>
        </Surface>
      )}

      <Surface className="p-5 animate-fade-up stagger-2">
        <SectionHeader comment="attendees" title="People" count={meeting.attendees.length} />
        <ul className="mt-4 flex flex-wrap gap-2">
          {meeting.attendees.map((a) => (
            <li
              key={a}
              className="flex items-center gap-2 rounded-full border border-hairline bg-elevated/60 px-3 py-1"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber/20 font-mono text-[9px] text-amber">
                {a
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="text-[12px] text-ink-muted">{a}</span>
            </li>
          ))}
        </ul>
      </Surface>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Notes panel */}
        <Surface className="p-5 animate-fade-up stagger-3">
          <SectionHeader
            comment="meeting notes"
            title="Notes"
            count={meetingNotes.length}
          />
          <div className="mt-4 flex flex-col gap-3">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Jot the standup, decisions, follow-ups…"
              rows={4}
              className="w-full resize-none rounded-md border border-hairline bg-base px-3 py-2 font-mono text-[12px] leading-relaxed text-ink placeholder:text-ink-dim focus:border-edge focus:outline-none"
            />
            <button
              onClick={handleCreateNote}
              disabled={!noteBody.trim()}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-hairline bg-elevated px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors hover:border-amber/50 hover:text-amber disabled:opacity-40"
            >
              <NotebookPen className="h-3 w-3" />
              attach note
            </button>
          </div>

          {meetingNotes.length > 0 && (
            <ul className="mt-5 flex flex-col gap-3">
              {meetingNotes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-hairline bg-elevated/40 p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[13px] text-ink">{n.title}</p>
                    <Badge tone="link">{n.type}</Badge>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-line font-mono text-[11.5px] leading-relaxed text-ink-muted">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        {/* Tasks panel */}
        <Surface className="p-5 animate-fade-up stagger-4">
          <SectionHeader
            comment="follow-up tasks"
            title="Tasks"
            count={meetingTasks.length}
          />
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                }}
                placeholder="new follow-up…"
                className="flex-1 rounded-md border border-hairline bg-base px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-dim focus:border-edge focus:outline-none"
              />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as Priority)}
                className="rounded-md border border-hairline bg-base px-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted focus:border-edge focus:outline-none"
              >
                <option value="urgent">urgent</option>
                <option value="high">high</option>
                <option value="med">med</option>
                <option value="low">low</option>
              </select>
              <button
                onClick={handleCreateTask}
                disabled={!taskTitle.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-base shadow-glow transition-transform duration-150 ease-spring hover:translate-x-0.5 active:scale-[0.97] disabled:opacity-40"
              >
                <ListPlus className="h-3 w-3" />
                add
              </button>
            </div>
          </div>

          {meetingTasks.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2">
              {meetingTasks.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border border-hairline bg-elevated/40 px-3 py-2",
                    t.status === "done" && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      t.status === "done" ? "bg-ok" : "bg-amber",
                    )}
                  />
                  <p
                    className={cn(
                      "flex-1 truncate text-[13px] text-ink",
                      t.status === "done" && "line-through",
                    )}
                  >
                    {t.title}
                  </p>
                  <Badge>{t.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
