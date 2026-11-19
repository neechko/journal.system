import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(async () => ({ user: { id: "editor-user" } })),
  revalidatePath: vi.fn(),
  screenSubmission: vi.fn(async () => undefined),
  assignReviewer: vi.fn(async () => undefined),
  unassignReviewer: vi.fn(async () => ({ submissionId: "22222222-2222-4222-8222-222222222222" })),
  submitReview: vi.fn(async () => undefined),
  requestRevision: vi.fn(async () => undefined),
  recordDecision: vi.fn(async () => undefined),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({ auth: mocks.auth, isOidcConfigured: true }));
vi.mock("@/server/db/client", () => ({ getDatabase: () => ({}) }));
vi.mock("@/modules/tenancy/infrastructure/postgres-repository", () => ({
  createPostgresTenancyRepository: () => ({}),
}));
vi.mock("@/modules/editorial/infrastructure/postgres-repository", () => ({
  createPostgresEditorialRepository: () => ({}),
}));
vi.mock("@/modules/editorial/application/use-cases", () => ({
  screenSubmission: mocks.screenSubmission,
  assignReviewer: mocks.assignReviewer,
  unassignReviewer: mocks.unassignReviewer,
  submitReview: mocks.submitReview,
  requestRevision: mocks.requestRevision,
  recordDecision: mocks.recordDecision,
  withdrawSubmission: vi.fn(),
}));

import {
  assignReviewerAction,
  recordDecisionAction,
  requestRevisionAction,
  screenSubmissionAction,
  submitReviewAction,
  unassignReviewerAction,
} from "../src/modules/editorial/presentation/actions";

const submissionId = "22222222-2222-4222-8222-222222222222";
const assignmentId = "33333333-3333-4333-8333-333333333333";
const previousState = { status: "success" as const, message: "" };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("editorial action boundaries", () => {
  it("requires an explicit screening decision", async () => {
    const data = form({ submissionId, editorUserId: "editor-user", reason: "Screening rationale" });
    expect(await screenSubmissionAction(previousState, data)).toMatchObject({ status: "error" });
    expect(mocks.screenSubmission).not.toHaveBeenCalled();

    data.set("pass", "false");
    expect(await screenSubmissionAction(previousState, data)).toMatchObject({ status: "success" });
    expect(mocks.screenSubmission).toHaveBeenCalledWith({}, {}, expect.objectContaining({ pass: false }));
  });

  it("keeps reviewer assignments blind unless the editor explicitly changes it", async () => {
    const data = form({
      submissionId,
      editorUserId: "editor-user",
      reviewerUserId: "reviewer-user",
      role: "reviewer",
    });
    expect(await assignReviewerAction(previousState, data)).toMatchObject({ status: "success" });
    expect(mocks.assignReviewer).toHaveBeenCalledWith({}, {}, expect.objectContaining({ isBlind: true }));
  });

  it("uses the returned submission ID when revoking a reviewer assignment", async () => {
    const data = form({ assignmentId, editorUserId: "editor-user", reason: "Assignment no longer needed" });
    expect(await unassignReviewerAction(previousState, data)).toMatchObject({ status: "success" });
    expect(mocks.unassignReviewer).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/editor/submissions/${submissionId}`);
  });

  it("returns a validation error for malformed review scores", async () => {
    const review = form({
      assignmentId,
      reviewerUserId: "editor-user",
      recommendation: "accept",
      commentsToAuthor: "Detailed review for the author",
      scores: "{broken",
    });
    expect(await submitReviewAction(previousState, review)).toMatchObject({ status: "error" });
    expect(mocks.submitReview).not.toHaveBeenCalled();
  });

  it("does not accept browser-supplied reviewer summaries", async () => {
    const revision = form({
      submissionId,
      editorUserId: "editor-user",
      reason: "The manuscript requires substantial revision",
      reviewerRecommendations: '[{"reviewerUserId":"fabricated"}]',
    });
    expect(await requestRevisionAction(previousState, revision)).toMatchObject({ status: "success" });
    expect(mocks.requestRevision).toHaveBeenCalledWith({}, {}, {
      submissionId,
      editorUserId: "editor-user",
      reason: "The manuscript requires substantial revision",
    });

    const decision = form({
      submissionId,
      editorUserId: "editor-user",
      outcome: "accept",
      rationale: "The evidence supports an acceptance decision",
      reviewerRecommendations: '[{"reviewerUserId":"fabricated"}]',
    });
    expect(await recordDecisionAction(previousState, decision)).toMatchObject({ status: "success" });
    expect(mocks.recordDecision).toHaveBeenCalledWith({}, {}, {
      submissionId,
      editorUserId: "editor-user",
      outcome: "accept",
      rationale: "The evidence supports an acceptance decision",
    });
  });
});
