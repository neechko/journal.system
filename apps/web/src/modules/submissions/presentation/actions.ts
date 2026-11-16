"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import {
  createDraftSubmission,
  submitDraftSubmission,
  uploadDraftManuscript,
  updateDraftSubmission,
} from "../application/use-cases";
import { isPdfPayload, MAX_MANUSCRIPT_BYTES } from "../application/file-validation";
import {
  createDraftSubmissionInputSchema,
  submitDraftSubmissionInputSchema,
  updateDraftSubmissionInputSchema,
} from "../application/validation";
import { createPostgresSubmissionRepository } from "../infrastructure/postgres-repository";
import { createPrivateSubmissionStorage } from "../infrastructure/local-private-storage";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import type { DraftSubmissionActionState } from "./action-state";

function getErrorState(error: unknown): DraftSubmissionActionState {
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

export async function createDraftSubmissionAction(
  _previousState: DraftSubmissionActionState,
  formData: FormData,
): Promise<DraftSubmissionActionState> {
  const parsed = createDraftSubmissionInputSchema.safeParse({
    organizationSlug: formData.get("organizationSlug"),
    journalSlug: formData.get("journalSlug"),
    title: formData.get("title"),
    abstract: formData.get("abstract") ?? "",
    keywords: formData.get("keywords") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the journal, title, abstract, and keywords, then try again.",
    };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return {
      status: "error",
      message: "Sign in with the configured institutional identity provider.",
    };
  }

  let submissionId: string;
  try {
    submissionId = await createDraftSubmission(
      createPostgresSubmissionRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/author/submissions");
  redirect(`/author/submissions/${submissionId}`);
}

export async function updateDraftSubmissionAction(
  _previousState: DraftSubmissionActionState,
  formData: FormData,
): Promise<DraftSubmissionActionState> {
  const parsed = updateDraftSubmissionInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    title: formData.get("title"),
    abstract: formData.get("abstract") ?? "",
    keywords: formData.get("keywords") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the title, abstract, and keywords, then try again.",
    };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return {
      status: "error",
      message: "Sign in with the configured institutional identity provider.",
    };
  }

  try {
    await updateDraftSubmission(
      createPostgresSubmissionRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/author/submissions");
  revalidatePath(`/author/submissions/${parsed.data.submissionId}`);
  redirect(`/author/submissions/${parsed.data.submissionId}`);
}

export async function uploadDraftManuscriptAction(
  _previousState: DraftSubmissionActionState,
  formData: FormData,
): Promise<DraftSubmissionActionState> {
  const parsedSubmissionId = z.uuid().safeParse(formData.get("submissionId"));
  const file = formData.get("manuscript");
  if (
    !parsedSubmissionId.success ||
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_MANUSCRIPT_BYTES ||
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return {
      status: "error",
      message: "Choose a PDF file no larger than 10 MB.",
    };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return {
      status: "error",
      message: "Sign in with the configured institutional identity provider.",
    };
  }

  const submissionId = parsedSubmissionId.data;
  try {
    const storage = createPrivateSubmissionStorage();
    const content = new Uint8Array(await file.arrayBuffer());
    if (!isPdfPayload(content)) {
      return {
        status: "error",
        message: "The selected file does not contain a valid PDF signature.",
      };
    }

    await uploadDraftManuscript(
      createPostgresSubmissionRepository(getDatabase()),
      storage,
      actorUserId,
      submissionId,
      content,
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/author/submissions");
  revalidatePath(`/author/submissions/${submissionId}`);
  redirect(`/author/submissions/${submissionId}`);
}

export async function submitDraftSubmissionAction(
  _previousState: DraftSubmissionActionState,
  formData: FormData,
): Promise<DraftSubmissionActionState> {
  const parsed = submitDraftSubmissionInputSchema.safeParse({
    submissionId: formData.get("submissionId"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confirm the submission before continuing.",
    };
  }

  const actorUserId = await getSessionUserId();
  if (!actorUserId) {
    return {
      status: "error",
      message: "Sign in with the configured institutional identity provider.",
    };
  }

  const { submissionId } = parsed.data;
  try {
    const storage = createPrivateSubmissionStorage();
    await submitDraftSubmission(
      createPostgresSubmissionRepository(getDatabase()),
      storage,
      actorUserId,
      submissionId,
      randomUUID(),
    );
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/author/submissions");
  revalidatePath(`/author/submissions/${submissionId}`);
  redirect(`/author/submissions/${submissionId}`);
}
