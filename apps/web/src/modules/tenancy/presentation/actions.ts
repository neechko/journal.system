"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { AppError } from "@/modules/shared/app-error";
import type { Session } from "next-auth";
import {
  createJournal,
  provisionOrganization,
  publishJournal,
  updateJournalProfile,
} from "../application/use-cases";
import { createPostgresTenancyRepository } from "../infrastructure/postgres-repository";
import type { ActionState } from "./action-state";
import {
  journalInputSchema,
  organizationInputSchema,
  publishJournalInputSchema,
  updateJournalProfileInputSchema,
} from "../application/validation";

function getErrorState(error: unknown): ActionState {
  if (error instanceof AppError) {
    return { status: "error", message: error.message };
  }
  throw error;
}

function getSessionUserId(session: Session | null) {
  return session?.user?.id;
}

export async function createOrganizationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = organizationInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the organization name, slug, and audit reason.",
    };
  }

  try {
    const actorUserId = getSessionUserId(await auth());
    if (!actorUserId) {
      return { status: "error", message: "Sign in to continue." };
    }

    await provisionOrganization(
      createPostgresTenancyRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
    revalidatePath("/admin/organizations");
    return { status: "success", message: "Organization created successfully." };
  } catch (error) {
    return getErrorState(error);
  }
}

export async function createJournalAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = journalInputSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? undefined,
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the journal title, slug, description, and audit reason.",
    };
  }

  try {
    const actorUserId = getSessionUserId(await auth());
    if (!actorUserId) {
      return { status: "error", message: "Sign in to continue." };
    }

    await createJournal(
      createPostgresTenancyRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
    revalidatePath(`/admin/organizations/${parsed.data.organizationId}`);
    return {
      status: "success",
      message: "Journal draft created successfully.",
    };
  } catch (error) {
    return getErrorState(error);
  }
}

export async function publishJournalAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = publishJournalInputSchema.safeParse({
    organizationId: formData.get("organizationId"),
    journalId: formData.get("journalId"),
    reason: formData.get("reason"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confirm publication and provide an audit reason.",
    };
  }

  try {
    const actorUserId = getSessionUserId(await auth());
    if (!actorUserId) {
      return { status: "error", message: "Sign in to continue." };
    }

    await publishJournal(
      createPostgresTenancyRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
    revalidatePath(`/admin/organizations/${parsed.data.organizationId}`);
    revalidatePath("/journals/[organizationSlug]/[journalSlug]", "page");
    return {
      status: "success",
      message: "The journal page is now available to the public.",
    };
  } catch (error) {
    return getErrorState(error);
  }
}

export async function updateJournalProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateJournalProfileInputSchema.safeParse({
    organizationId: formData.get("organizationId"),
    journalId: formData.get("journalId"),
    description: formData.get("description") ?? "",
    aimsScope: formData.get("aimsScope") ?? "",
    authorGuidelines: formData.get("authorGuidelines") ?? "",
    reason: formData.get("reason"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        "Check the journal description, aims and scope, author guidelines, audit reason, and confirmation.",
    };
  }

  try {
    const actorUserId = getSessionUserId(await auth());
    if (!actorUserId) {
      return { status: "error", message: "Sign in to continue." };
    }

    await updateJournalProfile(
      createPostgresTenancyRepository(getDatabase()),
      actorUserId,
      parsed.data,
    );
    revalidatePath(`/admin/organizations/${parsed.data.organizationId}`);
    revalidatePath("/journals/[organizationSlug]/[journalSlug]", "page");
    return { status: "success", message: "Journal profile saved successfully." };
  } catch (error) {
    return getErrorState(error);
  }
}
