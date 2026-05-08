"use client";

import type { DailyLogSections } from "@/lib/notes/templates";
import { AutoGrowTextarea } from "./auto-grow-textarea";

const SECTIONS: Array<{
  key: Exclude<keyof DailyLogSections, "dateLabel">;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    key: "keyLearnings",
    label: "Key Learnings",
    hint: "what clicked",
    placeholder: "What landed in your head today?",
  },
  {
    key: "mistakesLessons",
    label: "Mistakes & Lessons",
    hint: "what to avoid",
    placeholder: "What went sideways and why?",
  },
  {
    key: "nextSteps",
    label: "Next Steps",
    hint: "queued up",
    placeholder: "What's next on the list?",
  },
  {
    key: "questionsToAnswer",
    label: "Questions to Answer",
    hint: "open threads",
    placeholder: "What are you still unsure about?",
  },
  {
    key: "whatIBuiltToday",
    label: "What I Built Today",
    hint: "concrete output",
    placeholder: "Shipped commits, drafts, experiments…",
  },
];

export function DailyLogEditor({
  sections,
  onSectionChange,
}: {
  sections: DailyLogSections;
  onSectionChange: (key: keyof DailyLogSections, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {SECTIONS.map((s) => (
        <section
          key={s.key}
          className="grid gap-3 border-b border-border py-5 last:border-b-0 md:grid-cols-[200px_1fr]"
        >
          <div className="flex flex-col gap-1 pt-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              {s.label}
            </h3>
            <p className="text-[11px] text-muted-foreground">{s.hint}</p>
          </div>
          <AutoGrowTextarea
            value={sections[s.key] ?? ""}
            onChange={(v) => onSectionChange(s.key, v)}
            placeholder={s.placeholder}
            minRows={2}
            className="text-[13.5px] leading-[1.7] text-foreground placeholder:text-muted-foreground"
          />
        </section>
      ))}
    </div>
  );
}
