import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/auth/tokens";
import { bucketToDb } from "@/lib/serialize";
import type { PRBucket } from "@/lib/types";
import type {
  CIStatus as DbCIStatus,
  PRState as DbPRState,
} from "@prisma/client";

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const PER_BUCKET = 50;

export interface PRSyncResult {
  total: number;
  byBucket: Record<PRBucket, number>;
}

const PR_FRAGMENT = /* GraphQL */ `
  fragment PRFields on PullRequest {
    id
    number
    title
    url
    state
    isDraft
    additions
    deletions
    createdAt
    updatedAt
    author { login }
    repository { nameWithOwner }
    comments { totalCount }
    reviewRequests(first: 10) {
      nodes {
        requestedReviewer {
          ... on User { login }
        }
      }
    }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup { state }
        }
      }
    }
  }
`;

const QUERY = /* GraphQL */ `
  query PRBuckets {
    authored: search(query: "is:pr author:@me state:open", type: ISSUE, first: ${PER_BUCKET}) {
      nodes { ... on PullRequest { ...PRFields } }
    }
    review: search(query: "is:pr review-requested:@me state:open", type: ISSUE, first: ${PER_BUCKET}) {
      nodes { ... on PullRequest { ...PRFields } }
    }
    assigned: search(query: "is:pr assignee:@me state:open", type: ISSUE, first: ${PER_BUCKET}) {
      nodes { ... on PullRequest { ...PRFields } }
    }
  }
  ${PR_FRAGMENT}
`;

interface RawPR {
  id: string;
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  additions: number;
  deletions: number;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  repository: { nameWithOwner: string };
  comments: { totalCount: number };
  reviewRequests: {
    nodes: { requestedReviewer: { login?: string } | null }[];
  };
  commits: {
    nodes: {
      commit: {
        statusCheckRollup: {
          state: "SUCCESS" | "FAILURE" | "ERROR" | "PENDING" | "EXPECTED";
        } | null;
      };
    }[];
  };
}

interface GraphQLResponse {
  data?: {
    authored: { nodes: RawPR[] };
    review: { nodes: RawPR[] };
    assigned: { nodes: RawPR[] };
  };
  errors?: { message: string }[];
}

export async function syncGitHubPRs(userId: string): Promise<PRSyncResult> {
  const token = await getValidAccessToken(userId, "github");
  if (!token) throw new Error("No GitHub access token — re-link account");

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("GitHub GraphQL returned no data");

  // Bucket precedence: review-requested > assigned > authored. Stale wins
  // over authored when the PR is older than the threshold.
  const now = Date.now();
  const merged = new Map<string, RawPR & { bucket: PRBucket }>();

  for (const pr of json.data.authored.nodes) {
    const stale = now - new Date(pr.updatedAt).getTime() > STALE_MS;
    merged.set(pr.id, { ...pr, bucket: stale ? "stale" : "authored" });
  }
  for (const pr of json.data.assigned.nodes) {
    merged.set(pr.id, { ...pr, bucket: "assigned" });
  }
  for (const pr of json.data.review.nodes) {
    merged.set(pr.id, { ...pr, bucket: "review-requested" });
  }

  const byBucket: Record<PRBucket, number> = {
    "review-requested": 0,
    authored: 0,
    assigned: 0,
    stale: 0,
  };

  // Replace strategy — wipe and re-insert. PRs that disappeared from search
  // (closed, merged, no longer requested) are simply gone.
  await prisma.$transaction([
    prisma.pullRequest.deleteMany({ where: { userId } }),
    prisma.pullRequest.createMany({
      data: Array.from(merged.values()).map((pr) => {
        byBucket[pr.bucket]++;
        return {
          userId,
          externalId: pr.id,
          number: pr.number,
          repo: pr.repository.nameWithOwner,
          title: pr.title,
          state: mapState(pr) as DbPRState,
          bucket: bucketToDb(pr.bucket),
          author: pr.author?.login ?? "unknown",
          reviewers: pr.reviewRequests.nodes
            .map((n) => n.requestedReviewer?.login)
            .filter((l): l is string => Boolean(l)),
          htmlUrl: pr.url,
          additions: pr.additions,
          deletions: pr.deletions,
          comments: pr.comments.totalCount,
          ciStatus: mapCI(pr) as DbCIStatus,
          createdAt: new Date(pr.createdAt),
          updatedAt: new Date(pr.updatedAt),
        };
      }),
    }),
  ]);

  return { total: merged.size, byBucket };
}

function mapState(pr: RawPR): "open" | "draft" | "merged" | "closed" {
  if (pr.state === "MERGED") return "merged";
  if (pr.state === "CLOSED") return "closed";
  return pr.isDraft ? "draft" : "open";
}

function mapCI(pr: RawPR): "passing" | "failing" | "pending" | "none" {
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup;
  if (!rollup) return "none";
  switch (rollup.state) {
    case "SUCCESS":
      return "passing";
    case "FAILURE":
    case "ERROR":
      return "failing";
    case "PENDING":
    case "EXPECTED":
      return "pending";
    default:
      return "none";
  }
}
