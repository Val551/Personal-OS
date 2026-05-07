"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Circle,
  CircleDashed,
  Filter,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { rankTopTasks } from "@/lib/priority/scoreTasks";
import {
  PRIORITY_META,
  WORKSPACE_META,
  type Priority,
  type Task,
  type TaskStatus,
  type Workspace,
} from "@/lib/types";
import { relativeDue } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_FILTER: { key: TaskStatus | "all" | "open"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "todo", label: "Todo" },
  { key: "doing", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

const WORKSPACES: (Workspace | "all")[] = ["all", "internship", "school", "personal", "club"];
const PRIORITIES: (Priority | "all")[] = ["all", "urgent", "high", "med", "low"];

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-ok" />;
  if (status === "doing") return <CircleDashed className="h-4 w-4 text-amber" />;
  if (status === "blocked") return <Circle className="h-4 w-4 text-urgent" />;
  return <Circle className="h-4 w-4 text-ink-dim" />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}

function TasksPageInner() {
  const params = useSearchParams();
  const focusId = params.get("focus");
  const { tasks, meetings, notes, createTask, toggleTaskComplete, deleteTask, updateTask } =
    useStore();

  const [status, setStatus] = useState<(typeof STATUS_FILTER)[number]["key"]>("open");
  const [workspace, setWorkspace] = useState<(typeof WORKSPACES)[number]>("all");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("all");
  const [drawerId, setDrawerId] = useState<string | null>(focusId);

  const [newTitle, setNewTitle] = useState("");
  const [newWorkspace, setNewWorkspace] = useState<Workspace>("internship");
  const [newPriority, setNewPriority] = useState<Priority>("med");

  const filtered = useMemo(() => {
    let out = tasks.slice();
    if (status === "open") out = out.filter((t) => t.status !== "done");
    else if (status !== "all") out = out.filter((t) => t.status === status);
    if (workspace !== "all") out = out.filter((t) => t.workspace === workspace);
    if (priority !== "all") out = out.filter((t) => t.priority === priority);
    // sort by score
    const ranked = rankTopTasks(out, meetings, out.length);
    return ranked.map((r) => r.task);
  }, [tasks, meetings, status, workspace, priority]);

  const counts = useMemo(() => {
    return {
      open: tasks.filter((t) => t.status !== "done").length,
      doing: tasks.filter((t) => t.status === "doing").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createTask({ title: newTitle.trim(), workspace: newWorkspace, priority: newPriority });
    setNewTitle("");
  };

  const drawerTask = drawerId ? tasks.find((t) => t.id === drawerId) ?? null : null;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex items-end justify-between pt-2 animate-fade-up">
        <div>
          <p className="comment-label">workspace · all tasks</p>
          <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
            Tasks<span className="text-amber">.</span>
          </h1>
          <p className="mt-2 font-mono text-[12px] text-ink-muted">
            <span className="text-ink">{counts.open}</span> open ·{" "}
            <span className="text-amber">{counts.doing}</span> doing ·{" "}
            <span className="text-urgent">{counts.blocked}</span> blocked ·{" "}
            <span className="text-ok">{counts.done}</span> done
          </p>
        </div>
      </header>

      {/* Quick create */}
      <Surface tone="elevated" className="flex items-center gap-3 px-4 py-2.5 animate-fade-up stagger-1">
        <span className="comment-label !text-amber">new</span>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          placeholder="Type a task and press ↵"
          className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-dim focus:outline-none"
        />
        <select
          value={newWorkspace}
          onChange={(e) => setNewWorkspace(e.target.value as Workspace)}
          className="rounded-md border border-hairline bg-base px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted focus:border-edge focus:outline-none"
        >
          {WORKSPACES.filter((w) => w !== "all").map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Priority)}
          className="rounded-md border border-hairline bg-base px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted focus:border-edge focus:outline-none"
        >
          {PRIORITIES.filter((p) => p !== "all").map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          disabled={!newTitle.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-base shadow-glow transition-transform duration-150 ease-spring hover:translate-x-0.5 active:scale-[0.97] disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          add
        </button>
      </Surface>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up stagger-2">
        <Filter className="h-3.5 w-3.5 text-ink-dim" />
        <FilterPills
          label="status"
          options={STATUS_FILTER.map((s) => ({ key: s.key, label: s.label }))}
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
        />
        <span className="h-3 w-px bg-hairline" />
        <FilterPills
          label="workspace"
          options={WORKSPACES.map((w) => ({ key: w, label: w }))}
          value={workspace}
          onChange={(v) => setWorkspace(v as Workspace)}
        />
        <span className="h-3 w-px bg-hairline" />
        <FilterPills
          label="priority"
          options={PRIORITIES.map((p) => ({ key: p, label: p }))}
          value={priority}
          onChange={(v) => setPriority(v as Priority)}
        />
      </div>

      {/* List */}
      <Surface className="overflow-hidden animate-fade-up stagger-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 font-mono text-[12px] text-ink-dim">
            {"// nothing matches that filter"}
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {filtered.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                meetingTitle={
                  t.linkedMeetingId ? meetings.find((m) => m.id === t.linkedMeetingId)?.title : undefined
                }
                onToggle={() => toggleTaskComplete(t.id)}
                onOpen={() => setDrawerId(t.id)}
              />
            ))}
          </ul>
        )}
      </Surface>

      {drawerTask && (
        <TaskDrawer
          key={drawerTask.id}
          task={drawerTask}
          meetingTitle={
            drawerTask.linkedMeetingId
              ? meetings.find((m) => m.id === drawerTask.linkedMeetingId)?.title
              : undefined
          }
          linkedNotes={notes.filter((n) => drawerTask.linkedNoteIds.includes(n.id))}
          onClose={() => setDrawerId(null)}
          onChange={(patch) => updateTask(drawerTask.id, patch)}
          onDelete={() => {
            deleteTask(drawerTask.id);
            setDrawerId(null);
          }}
        />
      )}
    </div>
  );
}

function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{label}:</span>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors duration-150",
            value === o.key
              ? "border-amber/40 bg-amber/10 text-amber"
              : "border-hairline bg-elevated/40 text-ink-muted hover:border-edge hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  meetingTitle,
  onToggle,
  onOpen,
}: {
  task: Task;
  meetingTitle?: string;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <li
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/40",
        task.status === "done" && "opacity-50",
      )}
    >
      <button
        onClick={onToggle}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-edge transition-colors hover:border-amber"
        aria-label="Complete"
      >
        {task.status === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-ok" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-hover:bg-amber/40" />
        )}
      </button>

      <button onClick={onOpen} className="min-w-0 text-left">
        <div className="flex items-center gap-2">
          <StatusIcon status={task.status} />
          <p
            className={cn(
              "truncate text-[13.5px] text-ink",
              task.status === "done" && "line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge dot dotColor={WORKSPACE_META[task.workspace].color}>
            {WORKSPACE_META[task.workspace].label}
          </Badge>
          <Badge
            dot
            dotColor={PRIORITY_META[task.priority].color}
            tone={
              task.priority === "urgent"
                ? "urgent"
                : task.priority === "high"
                  ? "warn"
                  : "neutral"
            }
          >
            {PRIORITY_META[task.priority].label}
          </Badge>
          {meetingTitle && (
            <Badge tone="link">
              <Calendar className="h-2.5 w-2.5" />
              {meetingTitle.slice(0, 24)}
            </Badge>
          )}
        </div>
      </button>

      <div className="flex items-center gap-3">
        {task.dueAt && (
          <span
            className={cn(
              "font-mono text-[11px] tabular",
              new Date(task.dueAt) < new Date() ? "text-urgent" : "text-ink-muted",
            )}
          >
            {relativeDue(task.dueAt)}
          </span>
        )}
      </div>
    </li>
  );
}

function TaskDrawer({
  task,
  meetingTitle,
  linkedNotes,
  onClose,
  onChange,
  onDelete,
}: {
  task: Task;
  meetingTitle?: string;
  linkedNotes: { id: string; title: string }[];
  onClose: () => void;
  onChange: (patch: Partial<Task>) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-[480px] flex-col border-l border-edge bg-floating shadow-floating"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <p className="comment-label">task · {task.id}</p>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <input
            value={task.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="bg-transparent font-display text-[26px] leading-tight tracking-tight-display text-ink focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="status">
              <select
                value={task.status}
                onChange={(e) => onChange({ status: e.target.value as TaskStatus })}
                className="w-full rounded-md border border-hairline bg-base px-2 py-1.5 font-mono text-[12px] text-ink focus:border-edge focus:outline-none"
              >
                <option value="todo">todo</option>
                <option value="doing">doing</option>
                <option value="blocked">blocked</option>
                <option value="done">done</option>
              </select>
            </Field>
            <Field label="priority">
              <select
                value={task.priority}
                onChange={(e) => onChange({ priority: e.target.value as Priority })}
                className="w-full rounded-md border border-hairline bg-base px-2 py-1.5 font-mono text-[12px] text-ink focus:border-edge focus:outline-none"
              >
                <option value="urgent">urgent</option>
                <option value="high">high</option>
                <option value="med">medium</option>
                <option value="low">low</option>
              </select>
            </Field>
            <Field label="workspace">
              <select
                value={task.workspace}
                onChange={(e) => onChange({ workspace: e.target.value as Workspace })}
                className="w-full rounded-md border border-hairline bg-base px-2 py-1.5 font-mono text-[12px] text-ink focus:border-edge focus:outline-none"
              >
                <option value="internship">internship</option>
                <option value="school">school</option>
                <option value="personal">personal</option>
                <option value="club">club</option>
              </select>
            </Field>
            <Field label="due">
              <input
                type="date"
                value={task.dueAt ? task.dueAt.slice(0, 10) : ""}
                onChange={(e) =>
                  onChange({
                    dueAt: e.target.value
                      ? new Date(e.target.value + "T17:00").toISOString()
                      : undefined,
                  })
                }
                className="w-full rounded-md border border-hairline bg-base px-2 py-1.5 font-mono text-[12px] text-ink focus:border-edge focus:outline-none"
              />
            </Field>
          </div>

          <Field label="notes">
            <textarea
              value={task.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={6}
              className="w-full resize-none rounded-md border border-hairline bg-base px-3 py-2 font-mono text-[12px] leading-relaxed text-ink placeholder:text-ink-dim focus:border-edge focus:outline-none"
              placeholder="// scratch space"
            />
          </Field>

          {(meetingTitle || linkedNotes.length > 0) && (
            <Field label="links">
              <div className="flex flex-wrap gap-2">
                {meetingTitle && (
                  <Badge tone="link">
                    <Calendar className="h-2.5 w-2.5" /> {meetingTitle}
                  </Badge>
                )}
                {linkedNotes.map((n) => (
                  <Badge key={n.id} tone="link">
                    {n.title}
                  </Badge>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
          <span className="font-mono text-[10px] text-ink-dim">
            updated {relativeDue(task.updatedAt)}
          </span>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted transition-colors hover:border-urgent/40 hover:text-urgent"
          >
            <Trash2 className="h-3 w-3" />
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="comment-label">{label}</span>
      {children}
    </label>
  );
}
