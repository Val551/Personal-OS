import { format } from "date-fns";

export interface NoteTemplate {
  title: string;
  body: string;
}

export interface DailyLogSections {
  dateLabel: string;
  keyLearnings: string;
  mistakesLessons: string;
  nextSteps: string;
  questionsToAnswer: string;
  whatIBuiltToday: string;
}

const SECTION_HEADERS: Array<{ heading: string; key: keyof Omit<DailyLogSections, "dateLabel"> }> = [
  { heading: "Key Learnings", key: "keyLearnings" },
  { heading: "Mistakes & Lessons", key: "mistakesLessons" },
  { heading: "Next Steps", key: "nextSteps" },
  { heading: "Questions to Answer", key: "questionsToAnswer" },
  { heading: "What I Built Today", key: "whatIBuiltToday" },
];

export const DAILY_LOG_SECTION_KEYS = SECTION_HEADERS.map((s) => s.key);

export function emptyDailyLog(now: Date = new Date()): DailyLogSections {
  return {
    dateLabel: format(now, "MMMM d, yyyy"),
    keyLearnings: "",
    mistakesLessons: "",
    nextSteps: "",
    questionsToAnswer: "",
    whatIBuiltToday: "",
  };
}

export function serializeDailyLog(s: DailyLogSections): string {
  const out: string[] = [`# ${s.dateLabel}`, ""];
  for (const { heading, key } of SECTION_HEADERS) {
    out.push(`## ${heading}`);
    out.push(s[key] ?? "");
    out.push("");
  }
  return out.join("\n");
}

export function parseDailyLog(body: string): DailyLogSections | null {
  const lines = body.split("\n");
  if (!lines[0]?.startsWith("# ")) return null;
  const dateLabel = lines[0].slice(2).trim();
  if (!dateLabel) return null;

  const sections: Partial<DailyLogSections> = { dateLabel };
  let currentKey: keyof DailyLogSections | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey && currentKey !== "dateLabel") {
      sections[currentKey] = buffer.join("\n").replace(/^\n+|\n+$/g, "");
    }
    buffer = [];
  };

  const headingToKey = new Map(
    SECTION_HEADERS.map((s) => [s.heading.toLowerCase(), s.key]),
  );

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      flush();
      const heading = line.slice(3).trim().toLowerCase();
      currentKey = (headingToKey.get(heading) as keyof DailyLogSections) ?? null;
    } else if (currentKey && currentKey !== "dateLabel") {
      buffer.push(line);
    }
  }
  flush();

  // Every section heading must be present (even empty) for the body to
  // qualify as a structured daily log.
  for (const { key } of SECTION_HEADERS) {
    if (sections[key] === undefined) return null;
  }
  return sections as DailyLogSections;
}

/**
 * Daily-log template. Stored as plain markdown so the body field stays
 * human-readable in the DB; the editor parses it back into structured
 * sections via parseDailyLog().
 */
export function buildDailyLogNote(now: Date = new Date()): NoteTemplate {
  const shortDate = format(now, "MMM d");
  return {
    title: `Daily log — ${shortDate}`,
    body: serializeDailyLog(emptyDailyLog(now)),
  };
}
