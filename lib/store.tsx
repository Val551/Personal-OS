"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createTaskAction,
  deleteTaskAction,
  setTaskStatusAction,
  toggleTaskCompleteAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "@/app/actions/notes";
import { saveRecapAction } from "@/app/actions/recap";
import { resyncPRsAction } from "@/app/actions/prs";
import {
  syncCalendarAction,
  type SyncCalendarResponse,
} from "@/app/actions/calendar";
import { updateMeetingAction } from "@/app/actions/meetings";
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

export interface InitialStoreData {
  tasks: Task[];
  meetings: Meeting[];
  notes: Note[];
  prs: PullRequest[];
  recaps: Recap[];
}

interface StoreState extends InitialStoreData {}

interface StoreActions {
  createTask: (input: {
    title: string;
    workspace?: Workspace;
    priority?: Priority;
    dueAt?: string;
    linkedMeetingId?: string;
    notes?: string;
  }) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;

  createNote: (input: {
    title?: string;
    body?: string;
    type?: NoteType;
    linkedMeetingId?: string;
    linkedTaskIds?: string[];
  }) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  saveRecap: (input: {
    date: string;
    accomplishments: string;
    blockers: string;
    topThree: string;
    carryOver: string;
  }) => Promise<Recap>;

  resyncPRs: () => Promise<void>;
  syncCalendar: () => Promise<SyncCalendarResponse["result"]>;
  updateMeeting: (id: string, patch: { workspace?: Workspace }) => Promise<void>;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

function rid(prefix: string) {
  return `${prefix}_temp_${Math.random().toString(36).slice(2, 9)}`;
}

// Optimistic ids carry "_temp_" until the server returns a real cuid. Any
// update/delete dispatched against a still-pending temp id has nothing to
// hit on the server, so we skip the round-trip entirely.
function isTempId(id: string) {
  return id.includes("_temp_");
}

function nowIso() {
  return new Date().toISOString();
}

export function StoreProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: InitialStoreData;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [meetings, setMeetings] = useState<Meeting[]>(initialData.meetings);
  const [notes, setNotes] = useState<Note[]>(initialData.notes);
  const [prs, setPRs] = useState<PullRequest[]>(initialData.prs);
  const [recaps, setRecaps] = useState<Recap[]>(initialData.recaps);

  // ---- Tasks ----------------------------------------------------------

  const createTask = useCallback<StoreActions["createTask"]>(async (input) => {
    const tempId = rid("t");
    const optimistic: Task = {
      id: tempId,
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
    setTasks((prev) => [optimistic, ...prev]);
    if (input.linkedMeetingId) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === input.linkedMeetingId ? { ...m, taskIds: [...m.taskIds, tempId] } : m,
        ),
      );
    }
    try {
      const real = await createTaskAction(input);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? real : t)));
      if (input.linkedMeetingId) {
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === input.linkedMeetingId
              ? { ...m, taskIds: m.taskIds.map((id) => (id === tempId ? real.id : id)) }
              : m,
          ),
        );
      }
      return real;
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  }, []);

  const updateTask = useCallback<StoreActions["updateTask"]>(async (id, patch) => {
    const before = tasks.find((t) => t.id === id);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)),
    );
    if (isTempId(id)) return;
    try {
      // Map `Partial<Task>` to the server's UpdateTaskInput shape (only safe fields).
      const real = await updateTaskAction(id, {
        title: patch.title,
        notes: patch.notes,
        workspace: patch.workspace,
        priority: patch.priority,
        status: patch.status,
        dueAt: patch.dueAt === undefined ? undefined : (patch.dueAt ?? null),
      });
      if (real) setTasks((prev) => prev.map((t) => (t.id === id ? real : t)));
    } catch (err) {
      if (before) setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));
      throw err;
    }
  }, [tasks]);

  const toggleTaskComplete = useCallback<StoreActions["toggleTaskComplete"]>(
    async (id) => {
      const before = tasks.find((t) => t.id === id);
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
      if (isTempId(id)) return;
      try {
        const real = await toggleTaskCompleteAction(id);
        if (real) setTasks((prev) => prev.map((t) => (t.id === id ? real : t)));
      } catch (err) {
        if (before) setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));
        throw err;
      }
    },
    [tasks],
  );

  const setTaskStatus = useCallback<StoreActions["setTaskStatus"]>(
    async (id, status) => {
      const before = tasks.find((t) => t.id === id);
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
      if (isTempId(id)) return;
      try {
        const real = await setTaskStatusAction(id, status);
        if (real) setTasks((prev) => prev.map((t) => (t.id === id ? real : t)));
      } catch (err) {
        if (before) setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));
        throw err;
      }
    },
    [tasks],
  );

  const deleteTask = useCallback<StoreActions["deleteTask"]>(async (id) => {
    const before = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (isTempId(id)) return;
    try {
      await deleteTaskAction(id);
    } catch (err) {
      if (before) setTasks((prev) => [before, ...prev]);
      throw err;
    }
  }, [tasks]);

  // ---- Notes ----------------------------------------------------------

  const createNote = useCallback<StoreActions["createNote"]>(async (input) => {
    const tempId = rid("n");
    const optimistic: Note = {
      id: tempId,
      title: input.title?.trim() || "Untitled note",
      body: input.body ?? "",
      type: input.type ?? "general",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      linkedMeetingId: input.linkedMeetingId,
      linkedTaskIds: input.linkedTaskIds ?? [],
    };
    setNotes((prev) => [optimistic, ...prev]);
    if (input.linkedMeetingId) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === input.linkedMeetingId ? { ...m, noteIds: [...m.noteIds, tempId] } : m,
        ),
      );
    }
    try {
      const real = await createNoteAction(input);
      setNotes((prev) => prev.map((n) => (n.id === tempId ? real : n)));
      if (input.linkedMeetingId) {
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === input.linkedMeetingId
              ? { ...m, noteIds: m.noteIds.map((id) => (id === tempId ? real.id : id)) }
              : m,
          ),
        );
      }
      return real;
    } catch (err) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      throw err;
    }
  }, []);

  const updateNote = useCallback<StoreActions["updateNote"]>(async (id, patch) => {
    const before = notes.find((n) => n.id === id);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)),
    );
    if (isTempId(id)) return;
    try {
      const real = await updateNoteAction(id, {
        title: patch.title,
        body: patch.body,
        type: patch.type,
      });
      if (real) setNotes((prev) => prev.map((n) => (n.id === id ? real : n)));
    } catch (err) {
      if (before) setNotes((prev) => prev.map((n) => (n.id === id ? before : n)));
      throw err;
    }
  }, [notes]);

  const deleteNote = useCallback<StoreActions["deleteNote"]>(async (id) => {
    const before = notes.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (isTempId(id)) return;
    try {
      await deleteNoteAction(id);
    } catch (err) {
      if (before) setNotes((prev) => [before, ...prev]);
      throw err;
    }
  }, [notes]);

  // ---- Recap ----------------------------------------------------------

  const saveRecap = useCallback<StoreActions["saveRecap"]>(async (input) => {
    const real = await saveRecapAction(input);
    setRecaps((prev) => {
      const idx = prev.findIndex((r) => r.date === real.date);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = real;
        return next;
      }
      return [real, ...prev];
    });
    return real;
  }, []);

  // ---- PRs ------------------------------------------------------------

  const resyncPRs = useCallback<StoreActions["resyncPRs"]>(async () => {
    const real = await resyncPRsAction();
    setPRs(real);
  }, []);

  const syncCalendar = useCallback<StoreActions["syncCalendar"]>(async () => {
    const { result, meetings: fresh } = await syncCalendarAction();
    setMeetings(fresh);
    return result;
  }, []);

  const updateMeeting = useCallback<StoreActions["updateMeeting"]>(
    async (id, patch) => {
      const before = meetings.find((m) => m.id === id);
      setMeetings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
      try {
        const real = await updateMeetingAction(id, patch);
        setMeetings((prev) => prev.map((m) => (m.id === id ? real : m)));
      } catch (err) {
        if (before) setMeetings((prev) => prev.map((m) => (m.id === id ? before : m)));
        throw err;
      }
    },
    [meetings],
  );

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
      syncCalendar,
      updateMeeting,
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
      syncCalendar,
      updateMeeting,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
