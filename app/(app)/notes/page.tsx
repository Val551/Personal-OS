"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type NoteType } from "@/lib/types";
import {
  buildDailyLogNote,
  parseDailyLog,
  serializeDailyLog,
  type DailyLogSections,
} from "@/lib/notes/templates";
import { AutoGrowTextarea } from "@/components/notes/auto-grow-textarea";
import { DailyLogEditor } from "@/components/notes/daily-log-editor";
import { cn } from "@/lib/cn";

const TYPES: (NoteType | "all")[] = ["all", "worklog", "general"];

const TYPE_TONE: Record<NoteType, "amber" | "warn" | "link" | "ok"> = {
  worklog: "amber",
  general: "warn",
};

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageInner />
    </Suspense>
  );
}

function NotesPageInner() {
  const params = useSearchParams();
  const focusId = params.get("focus");
  const { notes, meetings, tasks, createNote, updateNote, deleteNote } = useStore();

  const [filter, setFilter] = useState<(typeof TYPES)[number]>("all");
  const [activeId, setActiveId] = useState<string | null>(focusId ?? notes[0]?.id ?? null);

  // Local draft state for the editor — keeps typing snappy. The server-side
  // save is debounced so we're not firing a Prisma write per keystroke.
  const [titleDraft, setTitleDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");

  useEffect(() => {
    if (!activeId && notes[0]) setActiveId(notes[0].id);
  }, [notes, activeId]);

  const filtered = useMemo(() => {
    const sorted = notes
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (filter === "all") return sorted;
    return sorted.filter((n) => n.type === filter);
  }, [notes, filter]);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  // Sync drafts when switching notes (or when the active note is created /
  // first loaded). Don't sync on every store update — we want server data
  // to flow in only when the active id changes.
  useEffect(() => {
    if (active) {
      setTitleDraft(active.title);
      setBodyDraft(active.body);
    } else {
      setTitleDraft("");
      setBodyDraft("");
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save: 500ms after the last keystroke, push the diff up.
  useEffect(() => {
    if (!active) return;
    const titleChanged = titleDraft !== active.title;
    const bodyChanged = bodyDraft !== active.body;
    if (!titleChanged && !bodyChanged) return;
    const handle = setTimeout(() => {
      const patch: { title?: string; body?: string } = {};
      if (titleChanged) patch.title = titleDraft;
      if (bodyChanged) patch.body = bodyDraft;
      updateNote(active.id, patch);
    }, 500);
    return () => clearTimeout(handle);
  }, [titleDraft, bodyDraft, active, updateNote]);

  const linkedMeeting = useMemo(
    () => (active?.linkedMeetingId ? meetings.find((m) => m.id === active.linkedMeetingId) : null),
    [active, meetings],
  );

  const linkedTasks = useMemo(
    () => (active ? tasks.filter((t) => active.linkedTaskIds.includes(t.id)) : []),
    [active, tasks],
  );

  // If this is a worklog note whose body parses as our daily-log template,
  // render the structured editor. Otherwise fall back to a plain textarea.
  const dailyLog = useMemo<DailyLogSections | null>(
    () => (active?.type === "worklog" ? parseDailyLog(bodyDraft) : null),
    [active?.type, bodyDraft],
  );

  const handleSectionChange = (
    key: keyof DailyLogSections,
    value: string,
  ) => {
    if (!dailyLog) return;
    setBodyDraft(serializeDailyLog({ ...dailyLog, [key]: value }));
  };

  // Flush any pending edits on the active note before switching away. Without
  // this, fast click-to-another-note loses the last <500ms of typing.
  const flushAndSelect = (nextId: string | null) => {
    if (active) {
      const patch: { title?: string; body?: string } = {};
      if (titleDraft !== active.title) patch.title = titleDraft;
      if (bodyDraft !== active.body) patch.body = bodyDraft;
      if (Object.keys(patch).length) updateNote(active.id, patch);
    }
    setActiveId(nextId);
  };

  const handleCreateBlank = async () => {
    const n = await createNote({ type: "general", title: "Untitled note", body: "" });
    flushAndSelect(n.id);
  };

  const handleCreateDailyLog = async () => {
    const tmpl = buildDailyLogNote();
    // Stored as type "worklog" — the existing daily-work-log type. No schema
    // change needed; the template is just a prefilled body.
    const n = await createNote({ type: "worklog", title: tmpl.title, body: tmpl.body });
    flushAndSelect(n.id);
  };

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex items-end justify-between pt-2 animate-fade-up">
        <div>
          <p className="comment-label">capture · all notes</p>
          <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
            Notes
          </h1>
          <p className="mt-2 font-mono text-[12px] text-ink-muted">
            <span className="text-ink">{notes.length}</span> total ·{" "}
            <span className="text-amber">
              {notes.filter((n) => n.type === "worklog").length}
            </span>{" "}
            worklog ·{" "}
            <span className="text-warn">
              {notes.filter((n) => n.type === "general").length}
            </span>{" "}
            general
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-amber px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-base shadow-glow transition-transform duration-150 ease-spring hover:translate-x-0.5 active:scale-[0.97]">
              <Plus className="h-3.5 w-3.5" />
              new note
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleCreateBlank}>
              <span className="flex flex-col">
                <span>Blank note</span>
                <span className="text-[10px] text-muted-foreground">empty canvas</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateDailyLog}>
              <span className="flex flex-col">
                <span>Daily log</span>
                <span className="text-[10px] text-muted-foreground">
                  internship template
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* List */}
        <div className="flex flex-col gap-3 animate-fade-up stagger-1">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  filter === t
                    ? "border-amber/40 bg-amber/10 text-amber"
                    : "border-hairline bg-elevated/40 text-ink-muted hover:border-edge hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <Surface className="overflow-hidden">
            <ul className="divide-y divide-hairline">
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center font-mono text-[12px] text-ink-dim">
                  No notes match.
                </li>
              )}
              {filtered.map((n) => {
                const isActive = n.id === activeId;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => flushAndSelect(n.id)}
                      className={cn(
                        "group flex w-full flex-col items-start gap-1.5 px-4 py-3 text-left transition-colors",
                        isActive ? "bg-elevated" : "hover:bg-elevated/40",
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <p className="truncate text-[13px] text-ink">{n.title}</p>
                        <Badge tone={TYPE_TONE[n.type]}>{n.type}</Badge>
                      </div>
                      <p className="line-clamp-2 font-mono text-[11px] leading-snug text-ink-dim">
                        {n.body || "Empty"}
                      </p>
                      <span className="font-mono text-[10px] text-ink-faint">
                        {format(new Date(n.updatedAt), "EEE LLL d · HH:mm")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Surface>
        </div>

        {/* Editor */}
        <Surface className="p-6 animate-fade-up stagger-2">
          {!active ? (
            <div className="flex min-h-[400px] items-center justify-center font-mono text-[12px] text-ink-dim">
              Pick a note from the list, or create one.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="flex-1 bg-transparent font-display text-[28px] leading-tight tracking-tight-display text-ink focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={active.type}
                    onChange={(e) =>
                      updateNote(active.id, { type: e.target.value as NoteType })
                    }
                    className="rounded-md border border-hairline bg-base px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted focus:border-edge focus:outline-none"
                  >
                    <option value="worklog">worklog</option>
                    <option value="general">general</option>
                  </select>
                  <button
                    onClick={() => {
                      deleteNote(active.id);
                      setActiveId(null);
                    }}
                    className="rounded-md border border-hairline px-2 py-1 text-ink-muted transition-colors hover:border-urgent/40 hover:text-urgent"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-dim">
                <span>created {format(new Date(active.createdAt), "LLL d · HH:mm")}</span>
                <span>·</span>
                <span>updated {format(new Date(active.updatedAt), "LLL d · HH:mm")}</span>
                {linkedMeeting && (
                  <>
                    <span>·</span>
                    <Badge tone="link">linked to {linkedMeeting.title.slice(0, 28)}</Badge>
                  </>
                )}
                {linkedTasks.map((t) => (
                  <Badge key={t.id} tone="amber">
                    {t.title.slice(0, 22)}
                  </Badge>
                ))}
              </div>

              {dailyLog ? (
                <div className="-mx-1">
                  <p className="text-[28px] font-semibold leading-tight tracking-tight">
                    {dailyLog.dateLabel}
                  </p>
                  <DailyLogEditor
                    sections={dailyLog}
                    onSectionChange={handleSectionChange}
                  />
                </div>
              ) : (
                <AutoGrowTextarea
                  value={bodyDraft}
                  onChange={setBodyDraft}
                  placeholder="Start typing…"
                  minRows={6}
                  className="font-mono text-[13.5px] leading-[1.7] text-ink placeholder:text-ink-dim"
                />
              )}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
