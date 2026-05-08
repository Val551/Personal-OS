"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  GitPullRequestDraft,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { type PRBucket, type PullRequest } from "@/lib/types";
import { formatPRAge } from "@/lib/format";
import { cn } from "@/lib/cn";

const BUCKETS: { key: PRBucket; label: string; comment: string; tone: "amber" | "urgent" | "link" | "neutral" }[] = [
  { key: "review-requested", label: "Needs your review", comment: "review-requested", tone: "amber" },
  { key: "authored", label: "Your pull requests", comment: "authored by you", tone: "link" },
  { key: "assigned", label: "Assigned", comment: "assigned to you", tone: "neutral" },
  { key: "stale", label: "Stale", comment: "no activity > 7 days", tone: "urgent" },
];

function PRStateIcon({ pr }: { pr: PullRequest }) {
  if (pr.state === "merged") return <GitMerge className="h-3.5 w-3.5 text-link" />;
  if (pr.state === "draft") return <GitPullRequestDraft className="h-3.5 w-3.5 text-ink-dim" />;
  return <GitPullRequest className="h-3.5 w-3.5 text-ok" />;
}

function CIIcon({ status }: { status: PullRequest["ciStatus"] }) {
  if (status === "passing") return <CheckCircle2 className="h-3 w-3 text-ok" />;
  if (status === "failing") return <AlertCircle className="h-3 w-3 text-urgent" />;
  if (status === "pending") return <Clock className="h-3 w-3 text-amber animate-pulse-dot" />;
  return null;
}

export default function GitHubPage() {
  const { prs, resyncPRs } = useStore();
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [tickerNow, setTickerNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setTickerNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const out: Record<PRBucket, PullRequest[]> = {
      "review-requested": [],
      authored: [],
      assigned: [],
      stale: [],
    };
    for (const p of prs) out[p.bucket].push(p);
    return out;
  }, [prs]);

  const [syncError, setSyncError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSyncError(null);
    try {
      await resyncPRs();
      setLastSync(new Date());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "sync failed");
    } finally {
      setRefreshing(false);
    }
  };

  const totalAttention = grouped["review-requested"].length + grouped.stale.length;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex items-end justify-between pt-2 animate-fade-up">
        <div>
          <p className="comment-label">github · pull requests</p>
          <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
            Pull requests
          </h1>
          <p className="mt-2 font-mono text-[12px] text-ink-muted">
            <span className="text-ink">{prs.length}</span> tracked ·{" "}
            <span className="text-amber">{totalAttention}</span> needing your attention
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-ink-dim">
            {syncError ? (
              <span className="text-urgent">error · {syncError}</span>
            ) : (
              <>
                last synced{" "}
                <span className="text-ink-muted" suppressHydrationWarning>
                  {format(lastSync, "HH:mm:ss")}
                </span>
              </>
            )}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-elevated px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted transition-colors hover:border-amber/50 hover:text-amber disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            sync
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {BUCKETS.map((b, idx) => {
          const list = grouped[b.key];
          return (
            <Surface
              key={b.key}
              className={cn("p-5 animate-fade-up", `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="comment-label">{b.comment}</p>
                  <h2 className="mt-1 flex items-center gap-2 font-display text-[22px] tracking-tight-display text-ink">
                    {b.label}
                    <span className="font-mono text-[12px] tracking-normal text-ink-dim">
                      {list.length}
                    </span>
                  </h2>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {list.length === 0 && (
                  <li className="rounded-md border border-dashed border-hairline px-3 py-6 text-center font-mono text-[11px] text-ink-dim">
                    Inbox zero.
                  </li>
                )}
                {list.map((p) => {
                  const ageMs = tickerNow.getTime() - new Date(p.updatedAt).getTime();
                  const isHot = ageMs < 60 * 60 * 1000;
                  return (
                    <li key={p.id}>
                      <a
                        href={p.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group block rounded-lg border border-hairline bg-elevated/40 p-3.5 transition-all duration-150 hover:border-edge hover:bg-elevated"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="flex items-center gap-2">
                            <PRStateIcon pr={p} />
                            <span className="text-ink-muted">{p.repo}</span>
                            <span className="text-ink-faint">·</span>
                            <span className="text-amber">#{p.number}</span>
                          </span>
                          <ExternalLink className="h-3 w-3 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13.5px] leading-snug text-ink group-hover:text-ink">
                          {p.title}
                        </p>
                        <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-ink-dim">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <CIIcon status={p.ciStatus} />
                              <span
                                className={cn(
                                  p.ciStatus === "failing" && "text-urgent",
                                  p.ciStatus === "passing" && "text-ok",
                                  p.ciStatus === "pending" && "text-amber",
                                )}
                              >
                                {p.ciStatus}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-ok">+{p.additions}</span>
                              <span className="text-urgent">−{p.deletions}</span>
                            </span>
                            <span>{p.comments} cmts</span>
                            <span>by {p.author}</span>
                          </div>
                          <span className={cn(isHot && "text-amber")}>
                            {formatPRAge(p.updatedAt, tickerNow)} ago
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
