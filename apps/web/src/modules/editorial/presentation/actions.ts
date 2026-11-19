"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/modules/shared/app-error";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { createPostgresEditorialRepository } from "../infrastructure/postgres-repository";
import {
  screenSubmission,
  assignReviewer,
  unassignReviewer as unassignReviewerUseCase,
  submitReview,
  requestRevision,
  recordDecision,
  withdrawSubmission,
} from "../application/use-cases";
import {
  screeningInputSchema,
  assignReviewerInputSchema,
  unassignReviewerInputSchema,
  submitReviewInputSchema,
  requestRevisionInputSchema,
  recordDecisionInputSchema,
  withdrawSubmissionInputSchema,
} from "../application/validation";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

function getErrorState(error: unknown): { status: "error"; message: string } {
  if (error instanceof AppError) {
    return { status: "error", message: error.message };
  }
  throw error;
}

async function getSessionUserId() {
  if (!isOidcConfigured) {
    return null;
  }
  return (await auth())?.user?.id ?? null;
}

const INVALID_JSON = Symbol("invalid-json");

function parseOptionalJson(value: FormDataEntryValue | null, fallback: unknown): unknown {
  if (value === null || value === "") return fallback;
  if (typeof value !== "string" || value.length > 50_000) return INVALID_JSON;
  try {
    return JSON.parse(value);
  } catch {
    return INVALID_JSON;
  }
}

export async function screenSubmissionAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const pass = formData.get("pass");
  if (pass !== "true" && pass !== "false") {
    return { status: "error", message: "Select a screening decision." };
  }
  const parsed = screeningInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    editorUserId: formData.get("editorUserId"),
    pass: pass === "true",
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Check the screening decision and reason." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.editorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  try {
    await screenSubmission(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/editor/submissions");
  revalidatePath(`/editor/submissions/${parsed.data.submissionId}`);
  return { status: "success", message: parsed.data.pass ? "Submission passed screening." : "Submission rejected." };
}

export async function assignReviewerAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const isBlind = formData.get("isBlind");
  if (isBlind !== null && isBlind !== "true" && isBlind !== "false") {
    return { status: "error", message: "Invalid blind-review setting." };
  }
  const parsed = assignReviewerInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    editorUserId: formData.get("editorUserId"),
    reviewerUserId: formData.get("reviewerUserId"),
    role: formData.get("role"),
    dueAt: formData.get("dueAt"),
    isBlind: isBlind === null ? undefined : isBlind === "true",
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Check reviewer details and due date." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.editorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  const input = {
    ...parsed.data,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
  };

  try {
    await assignReviewer(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      input
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/editor/submissions");
  revalidatePath(`/editor/submissions/${parsed.data.submissionId}`);
  return { status: "success", message: "Reviewer assigned successfully." };
}

export async function unassignReviewerAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = unassignReviewerInputSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    editorUserId: formData.get("editorUserId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Provide a reason for unassigning." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.editorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  let submissionId: string;
  try {
    const updated = await unassignReviewerUseCase(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
    submissionId = updated.submissionId;
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/editor/submissions");
  revalidatePath(`/editor/submissions/${submissionId}`);
  return { status: "success", message: "Reviewer unassigned successfully." };
}

export async function submitReviewAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = submitReviewInputSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    reviewerUserId: formData.get("reviewerUserId"),
    recommendation: formData.get("recommendation"),
    commentsToAuthor: formData.get("commentsToAuthor"),
    commentsToEditor: formData.get("commentsToEditor") || null,
    scores: parseOptionalJson(formData.get("scores"), null),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Check all required fields." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.reviewerUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  try {
    await submitReview(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/reviewer/submissions");
  revalidatePath(`/reviewer/submissions/${parsed.data.assignmentId}`);
  return { status: "success", message: "Review submitted successfully." };
}

export async function requestRevisionAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = requestRevisionInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    editorUserId: formData.get("editorUserId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Provide a reason for revision request." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.editorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  try {
    await requestRevision(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/editor/submissions");
  revalidatePath(`/editor/submissions/${parsed.data.submissionId}`);
  return { status: "success", message: "Revision requested successfully." };
}

export async function recordDecisionAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = recordDecisionInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    editorUserId: formData.get("editorUserId"),
    outcome: formData.get("outcome"),
    rationale: formData.get("rationale"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Provide rationale and outcome." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.editorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  try {
    await recordDecision(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/editor/submissions");
  revalidatePath(`/editor/submissions/${parsed.data.submissionId}`);
  return { status: "success", message: `Decision recorded: ${parsed.data.outcome}.` };
}

export async function withdrawSubmissionAction(
  _previousState: { status: "error" | "success"; message: string },
  formData: FormData
) {
  const parsed = withdrawSubmissionInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    authorUserId: formData.get("authorUserId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid input. Provide a reason for withdrawal." };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return { status: "error", message: "Sign in to continue." };
  }

  if (parsed.data.authorUserId !== actorUserId) {
    return { status: "error", message: "Unauthorized action." };
  }

  try {
    await withdrawSubmission(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      parsed.data
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/author/submissions");
  revalidatePath(`/author/submissions/${parsed.data.submissionId}`);
  return { status: "success", message: "Submission withdrawn successfully." };
}
