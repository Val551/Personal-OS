"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { buildSeed } from "@/lib/mock/seed";
import type {
  Meeting,
  Note,
  NoteType,
  Priority,
  PullRequest,
  Recap,
  Task,
  TaskStatus,
  Workspace,
} from "@/lib/types";

interface StoreState {
  tasks: Task[];
  meetings: Meeting[];
  notes: Note[];
  prs: PullRequest[];
  recaps: Recap[];
}

interface StoreActions {
  createTask: (input: {
    title: string;
    workspace?: Workspace;
    priority?: Priority;
    dueAt?: string;
    linkedMeetingId?: string;
    notes?: string;
  }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  createNote: (input: {
    title?: string;
    body?: string;
    type?: NoteType;
    linkedMeetingId?: string;
    linkedTaskIds?: string[];
  }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  saveRecap: (input: {
    date: string;
    accomplishments: string;
    blockers: string;
    topThree: string;
    carryOver: string;
  }) => Recap;

  resyncPRs: () => void;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const seed = useMemo(() => buildSeed(), []);
  const [tasks, setTasks] = useState<Task[]>(seed.tasks);
  const [meetings, setMeetings] = useState<Meeting[]>(seed.meetings);
  const [notes, setNotes] = useState<Note[]>(seed.notes);
  const [prs, setPRs] = useState<PullRequest[]>(seed.prs);
  const [recaps, setRecaps] = useState<Recap[]>(seed.recaps);
  const [, setLastSync] = useState<string>(nowIso());

  const createTask = useCallback<StoreActions["createTask"]>((input) => {
    const t: Task = {
      id: rid("t"),
      title: input.title,
      notes: input.notes,
      workspace: input.workspace ?? "personal",
      priority: input.priority ?? "med",
      status: "todo",
      dueAt: input.dueAt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      linkedMeetingId: input.linkedMeetingId,
      linkedNoteIds: [],
    };
    setTasks((prev) => [t, ...prev]);
    if (input.linkedMeetingId) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === input.linkedMeetingId ? { ...m, taskIds: [...m.taskIds, t.id] } : m,
        ),
      );
    }
    return t;
  }, []);

  const updateTask = useCallback<StoreActions["updateTask"]>((id, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)),
    );
  }, []);

  const toggleTaskComplete = useCallback<StoreActions["toggleTaskComplete"]>((id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const isDone = t.status === "done";
        return {
          ...t,
          status: isDone ? "todo" : "done",
          completedAt: isDone ? undefined : nowIso(),
          updatedAt: nowIso(),
        };
      }),
    );
  }, []);

  const setTaskStatus = useCallback<StoreActions["setTaskStatus"]>((id, status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === "done" ? nowIso() : undefined,
              updatedAt: nowIso(),
            }
          : t,
      ),
    );
  }, []);

  const deleteTask = useCallback<StoreActions["deleteTask"]>((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createNote = useCallback<StoreActions["createNote"]>((input) => {
    const n: Note = {
      id: rid("n"),
      title: input.title?.trim() || "Untitled note",
      body: input.body ?? "",
      type: input.type ?? "general",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      linkedMeetingId: input.linkedMeetingId,
      linkedTaskIds: input.linkedTaskIds ?? [],
    };
    setNotes((prev) => [n, ...prev]);
    if (input.linkedMeetingId) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === input.linkedMeetingId ? { ...m, noteIds: [...m.noteIds, n.id] } : m,
        ),
      );
    }
    return n;
  }, []);

  const updateNote = useCallback<StoreActions["updateNote"]>((id, patch) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)),
    );
  }, []);

  const deleteNote = useCallback<StoreActions["deleteNote"]>((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const saveRecap = useCallback<StoreActions["saveRecap"]>((input) => {
    const existing = recaps.find((r) => r.date === input.date);
    if (existing) {
      const updated: Recap = {
        ...existing,
        ...input,
        updatedAt: nowIso(),
      };
      setRecaps((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
      return updated;
    }
    const r: Recap = {
      id: rid("r"),
      date: input.date,
      accomplishments: input.accomplishments,
      blockers: input.blockers,
      topThree: input.topThree,
      carryOver: input.carryOver,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setRecaps((prev) => [r, ...prev]);
    return r;
  }, [recaps]);

  const resyncPRs = useCallback<StoreActions["resyncPRs"]>(() => {
    setLastSync(nowIso());
    setPRs((prev) => prev.map((p) => ({ ...p, updatedAt: nowIso() })));
  }, []);

  const value = useMemo<Store>(
    () => ({
      tasks,
      meetings,
      notes,
      prs,
      recaps,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      setTaskStatus,
      createNote,
      updateNote,
      deleteNote,
      saveRecap,
      resyncPRs,
    }),
    [
      tasks,
      meetings,
      notes,
      prs,
      recaps,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      setTaskStatus,
      createNote,
      updateNote,
      deleteNote,
      saveRecap,
      resyncPRs,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
