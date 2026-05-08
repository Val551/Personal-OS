"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Check, Sunrise } from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";

function todayKey() {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

function yesterdayKey() {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

export default function RecapPage() {
  const { recaps, saveRecap } = useStore();
  const today = todayKey();
  const existing = useMemo(() => recaps.find((r) => r.date === today) ?? null, [recaps, today]);
  const yesterday = useMemo(
    () => recaps.find((r) => r.date === yesterdayKey()) ?? null,
    [recaps],
  );

  const [accomplishments, setAccomplishments] = useState(existing?.accomplishments ?? "");
  const [blockers, setBlockers] = useState(existing?.blockers ?? "");
  const [topThree, setTopThree] = useState(existing?.topThree ?? "");
  const [carryOver, setCarryOver] = useState(existing?.carryOver ?? "");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setAccomplishments(existing?.accomplishments ?? "");
    setBlockers(existing?.blockers ?? "");
    setTopThree(existing?.topThree ?? "");
    setCarryOver(existing?.carryOver ?? "");
  }, [existing]);

  const handleSave = () => {
    saveRecap({ date: today, accomplishments, blockers, topThree, carryOver });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <header className="flex items-end justify-between pt-2 animate-fade-up">
        <div>
          <p className="comment-label">end of day · {today}</p>
          <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
            Recap
          </h1>
          <p className="mt-2 font-mono text-[12px] text-ink-muted">
            close the loop. {existing ? "Edit today's recap." : "Reflect, then plan tomorrow."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-amber" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {format(new Date(), "EEEE")}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <Surface className="p-6 animate-fade-up stagger-1">
          <div className="flex flex-col gap-6">
            <RecapField
              comment="shipped today"
              title="Accomplishments"
              hint="What did you finish? Even one line counts."
              value={accomplishments}
              onChange={setAccomplishments}
              rows={4}
            />
            <div className="h-px bg-hairline" />
            <RecapField
              comment="friction"
              title="Blockers"
              hint="What's in the way? Note who can unblock."
              value={blockers}
              onChange={setBlockers}
              rows={3}
            />
            <div className="h-px bg-hairline" />
            <RecapField
              comment="tomorrow's bets"
              title="Top 3 priorities"
              hint="Three things, ordered. Resist the urge to list more."
              value={topThree}
              onChange={setTopThree}
              rows={4}
            />
            <div className="h-px bg-hairline" />
            <RecapField
              comment="rolling forward"
              title="Carry over"
              hint="What slipped? Be honest — past you knows."
              value={carryOver}
              onChange={setCarryOver}
              rows={3}
            />

            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-ink-dim">
                {existing
                  ? `last edited ${format(new Date(existing.updatedAt), "HH:mm")}`
                  : "no recap yet today"}
              </span>
              <button
                onClick={handleSave}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-base shadow-glow transition-transform duration-150 ease-spring hover:translate-x-0.5 active:scale-[0.97]",
                  savedFlash && "bg-ok",
                )}
              >
                {savedFlash ? <Check className="h-3.5 w-3.5" /> : null}
                {savedFlash ? "saved" : existing ? "save changes" : "save recap"}
              </button>
            </div>
          </div>
        </Surface>

        {/* Yesterday peek */}
        <Surface className="p-5 animate-fade-up stagger-2">
          <SectionHeader comment="yesterday" title="Last seen" />
          {!yesterday ? (
            <p className="mt-4 text-[12px] text-muted-foreground">No recap yesterday.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4 font-mono text-[12px]">
              <YPeek heading="shipped" body={yesterday.accomplishments} />
              <YPeek heading="blockers" body={yesterday.blockers} muted />
              <YPeek heading="top 3" body={yesterday.topThree} />
              <YPeek heading="carry-over" body={yesterday.carryOver} muted />
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function RecapField({
  comment,
  title,
  hint,
  value,
  onChange,
  rows,
}: {
  comment: string;
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="comment-label">{comment}</p>
          <h3 className="mt-1 font-display text-[22px] leading-tight tracking-tight-display text-ink">
            {title}
          </h3>
        </div>
        <span className="font-mono text-[10.5px] text-ink-dim">{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-none rounded-md border border-hairline bg-base px-3 py-2.5 font-mono text-[13px] leading-[1.7] text-ink placeholder:text-ink-dim focus:border-edge focus:outline-none"
        placeholder="Type here…"
      />
    </div>
  );
}

function YPeek({
  heading,
  body,
  muted,
}: {
  heading: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="comment-label">{heading}</p>
      {body ? (
        <p
          className={cn(
            "whitespace-pre-line text-[12px] leading-[1.65]",
            muted ? "text-ink-dim" : "text-ink-muted",
          )}
        >
          {body}
        </p>
      ) : (
        <p className="text-[12px] text-ink-faint">—</p>
      )}
    </div>
  );
}
