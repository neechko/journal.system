import { AppError } from "@/modules/shared/app-error";
import type {
  JournalAccess,
  JournalStaffMember,
  OrganizationWorkspace,
  PublishedJournalPage,
  PublishedJournal,
  TenancyRepository,
} from "./ports";
import type {
  JournalInput,
  OrganizationInput,
  PublishJournalInput,
  UpdateJournalProfileInput,
  GrantJournalRoleInput,
  RevokeJournalRoleInput,
} from "./validation";

export async function provisionOrganization(
  repository: TenancyRepository,
  actorUserId: string,
  input: OrganizationInput,
) {
  return repository.transaction(async (transaction) => {
    if (!(await transaction.isPlatformOperator(actorUserId))) {
      throw new AppError(
        "FORBIDDEN",
        "This action requires platform-operator access.",
      );
    }

    const organization = await transaction.insertOrganization(input);
    await transaction.insertOrganizationMembership(
      organization.id,
      actorUserId,
    );
    await transaction.insertAuditEvent({
      organizationId: organization.id,
      actorUserId,
      action: "organization.created",
      entityType: "organization",
      entityId: organization.id,
      reason: input.reason,
    });

    return organization;
  });
}

export async function createJournal(
  repository: TenancyRepository,
  actorUserId: string,
  input: JournalInput,
) {
  return repository.transaction(async (transaction) => {
    if (
      !(await transaction.isOrganizationAdmin(
        actorUserId,
        input.organizationId,
      ))
    ) {
      throw new AppError(
        "NOT_FOUND",
        "Organization not found or access denied.",
      );
    }

    const journal = await transaction.insertJournal(actorUserId, input);
    await transaction.insertAuditEvent({
      organizationId: input.organizationId,
      actorUserId,
      action: "journal.created",
      entityType: "journal",
      entityId: journal.id,
      reason: input.reason,
    });

    return journal;
  });
}

export async function publishJournal(
  repository: TenancyRepository,
  actorUserId: string,
  input: PublishJournalInput,
) {
  return repository.transaction(async (transaction) => {
    if (
      !(await transaction.isOrganizationAdmin(
        actorUserId,
        input.organizationId,
      ))
    ) {
      throw new AppError(
        "NOT_FOUND",
        "Journal not found or access denied.",
      );
    }

    const journal = await transaction.findJournal(
      input.organizationId,
      input.journalId,
    );
    if (!journal) {
      throw new AppError("NOT_FOUND", "Journal not found.");
    }
    if (journal.publishedAt) {
      throw new AppError("CONFLICT", "This journal has already been published.");
    }

    const publishedJournal = await transaction.publishJournal(
      input.organizationId,
      input.journalId,
      new Date(),
    );
    if (!publishedJournal) {
      throw new AppError("CONFLICT", "This journal has already been published.");
    }

    await transaction.insertAuditEvent({
      organizationId: input.organizationId,
      actorUserId,
      action: "journal.published",
      entityType: "journal",
      entityId: input.journalId,
      reason: input.reason,
    });

    return publishedJournal;
  });
}

export async function updateJournalProfile(
  repository: TenancyRepository,
  actorUserId: string,
  input: UpdateJournalProfileInput,
) {
  return repository.transaction(async (transaction) => {
    if (
      !(await transaction.isOrganizationAdmin(
        actorUserId,
        input.organizationId,
      ))
    ) {
      throw new AppError(
        "NOT_FOUND",
        "Journal not found or access denied.",
      );
    }

    const journal = await transaction.findJournal(
      input.organizationId,
      input.journalId,
    );
    if (!journal) {
      throw new AppError("NOT_FOUND", "Journal not found.");
    }

    const updatedJournal = await transaction.updateJournalProfile(
      input.organizationId,
      input.journalId,
      {
        description: input.description,
        aimsScope: input.aimsScope,
        authorGuidelines: input.authorGuidelines,
      },
    );
    if (!updatedJournal) {
      throw new AppError(
        "CONFLICT",
        "The journal profile changed before it could be saved.",
      );
    }

    await transaction.insertAuditEvent({
      organizationId: input.organizationId,
      actorUserId,
      action: "journal.profile_updated",
      entityType: "journal",
      entityId: input.journalId,
      reason: input.reason,
    });

    return updatedJournal;
  });
}

export async function listOrganizations(
  repository: TenancyRepository,
  actorUserId: string,
) {
  return repository.listOrganizationsForUser(actorUserId);
}

export async function getJournalAccess(
  repository: TenancyRepository,
  actorUserId: string,
  journalId: string,
): Promise<JournalAccess | null> {
  return repository.getJournalAccess(actorUserId, journalId);
}

export async function grantJournalRole(
  repository: TenancyRepository,
  actorUserId: string,
  input: GrantJournalRoleInput,
): Promise<string> {
  return repository.transaction(async (transaction) => {
    if (!(await transaction.isOrganizationAdmin(actorUserId, input.organizationId)) ||
      !(await transaction.findJournal(input.organizationId, input.journalId))) {
      throw new AppError("NOT_FOUND", "Journal not found or access denied.");
    }
    const target = await transaction.findUserByEmail(input.email);
    if (!target) {
      throw new AppError("NOT_FOUND", "This account has not signed in yet.");
    }
    const membershipId = await transaction.insertJournalRole(actorUserId, target.id, input);
    await transaction.insertAuditEvent({
      organizationId: input.organizationId,
      actorUserId,
      action: "journal.role_granted",
      entityType: "journal_membership",
      entityId: membershipId,
      reason: input.reason,
    });
    return membershipId;
  });
}

export async function revokeJournalRole(
  repository: TenancyRepository,
  actorUserId: string,
  input: RevokeJournalRoleInput,
): Promise<void> {
  await repository.transaction(async (transaction) => {
    if (!(await transaction.isOrganizationAdmin(actorUserId, input.organizationId)) ||
      !(await transaction.findJournal(input.organizationId, input.journalId))) {
      throw new AppError("NOT_FOUND", "Journal not found or access denied.");
    }
    if (!(await transaction.revokeJournalRole(input.journalId, input.membershipId))) {
      throw new AppError("NOT_FOUND", "Active role not found.");
    }
    await transaction.insertAuditEvent({
      organizationId: input.organizationId,
      actorUserId,
      action: "journal.role_revoked",
      entityType: "journal_membership",
      entityId: input.membershipId,
      reason: input.reason,
    });
  });
}

export async function listJournalStaff(
  repository: TenancyRepository,
  actorUserId: string,
  organizationId: string,
  journalId: string,
): Promise<JournalStaffMember[]> {
  return repository.listJournalStaff(actorUserId, organizationId, journalId);
}

export async function getOrganizationWorkspace(
  repository: TenancyRepository,
  actorUserId: string,
  organizationId: string,
): Promise<OrganizationWorkspace | null> {
  return repository.getOrganizationWorkspace(actorUserId, organizationId);
}

export async function getPublicJournal(
  repository: TenancyRepository,
  organizationSlug: string,
  journalSlug: string,
): Promise<PublishedJournal | null> {
  return repository.getPublishedJournal(organizationSlug, journalSlug);
}

export async function getPublishedJournalReference(
  repository: TenancyRepository,
  organizationSlug: string,
  journalSlug: string,
) {
  return repository.getPublishedJournalReference(
    organizationSlug,
    journalSlug,
  );
}

export const PUBLIC_JOURNAL_PAGE_SIZE = 12;

export async function listPublicJournals(
  repository: TenancyRepository,
  page: number,
  searchTerm = "",
): Promise<PublishedJournalPage> {
  const offset = (page - 1) * PUBLIC_JOURNAL_PAGE_SIZE;
  const results = await repository.listPublishedJournals(
    offset,
    PUBLIC_JOURNAL_PAGE_SIZE + 1,
    searchTerm || undefined,
  );

  return {
    journals: results.slice(0, PUBLIC_JOURNAL_PAGE_SIZE),
    page,
    hasNextPage: results.length > PUBLIC_JOURNAL_PAGE_SIZE,
  };
}
