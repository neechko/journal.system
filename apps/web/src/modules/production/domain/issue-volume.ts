import { randomUUID } from "node:crypto";

export type IssueStatus = "planned" | "in_progress" | "published" | "archived";

export interface Volume {
  id: string;
  journalId: string;
  number: number;
  year: number;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Issue {
  id: string;
  journalId: string;
  volumeId: string | null;
  number: number;
  year: number;
  label: string | null;
  status: IssueStatus;
  coverImageFileId: string | null;
  description: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleInIssue {
  articleId: string;
  issueId: string;
  pageStart: number | null;
  pageEnd: number | null;
  order: number;
  articleType: string | null;
}

export function createVolume(
  journalId: string,
  number: number,
  year: number,
  label: string | null = null
): Volume {
  const now = new Date();
  return {
    id: randomUUID(),
    journalId,
    number,
    year,
    label,
    createdAt: now,
    updatedAt: now,
  };
}

export function createIssue(
  journalId: string,
  number: number,
  year: number,
  options: {
    volumeId?: string | null;
    label?: string | null;
    description?: string | null;
  } = {}
): Issue {
  const now = new Date();
  return {
    id: randomUUID(),
    journalId,
    volumeId: options.volumeId ?? null,
    number,
    year,
    label: options.label ?? null,
    status: "planned",
    coverImageFileId: null,
    description: options.description ?? null,
    publishedAt: null,
    publishedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateIssue(
  issue: Issue,
  updates: Partial<Pick<Issue, "label" | "description" | "coverImageFileId" | "volumeId">>
): Issue {
  return {
    ...issue,
    ...updates,
    updatedAt: new Date(),
  };
}

export function transitionIssueStatus(
  issue: Issue,
  newStatus: IssueStatus,
  actorUserId: string | null = null
): Issue {
  const validTransitions: Record<IssueStatus, IssueStatus[]> = {
    planned: ["in_progress", "published"],
    in_progress: ["published", "planned"],
    published: ["archived"],
    archived: [],
  };

  if (!validTransitions[issue.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${issue.status} to ${newStatus}`);
  }

  return {
    ...issue,
    status: newStatus,
    updatedAt: new Date(),
    ...(newStatus === "published" ? { publishedAt: new Date(), publishedBy: actorUserId } : {}),
  };
}

export function canModifyIssue(issue: Issue): boolean {
  return issue.status !== "published" && issue.status !== "archived";
}

export function getIssueCitation(issue: Issue, volume: Volume | null): string {
  const parts: string[] = [];
  if (volume) {
    parts.push(`Vol. ${volume.number}`);
  }
  parts.push(`No. ${issue.number}`);
  parts.push(`(${issue.year})`);
  return parts.join(" ");
}

export function generateIssueSlug(issue: Issue, volume: Volume | null): string {
  if (volume) {
    return `v${volume.number}-i${issue.number}`;
  }
  return `y${issue.year}-i${issue.number}`;
}