import type {
  JournalInput,
  OrganizationInput,
  UpdateJournalProfileInput,
  GrantJournalRoleInput,
} from "./validation";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

export interface JournalSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  aimsScope: string | null;
  authorGuidelines: string | null;
  publishedAt: Date | null;
}

export interface OrganizationWorkspace {
  organization: OrganizationSummary;
  journals: JournalSummary[];
}

export interface PublishedJournalCatalogItem {
  organizationName: string;
  organizationSlug: string;
  title: string;
  slug: string;
  description: string | null;
  publishedAt: Date;
}

export interface PublishedJournal extends PublishedJournalCatalogItem {
  aimsScope: string | null;
  authorGuidelines: string | null;
}

export interface PublishedJournalReference {
  organizationId: string;
  journalId: string;
}

export interface PublishedJournalPage {
  journals: PublishedJournalCatalogItem[];
  page: number;
  hasNextPage: boolean;
}

export interface AuditEventInput {
  organizationId: string | null;
  actorUserId: string;
  actorLabel?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
}

export type JournalRole =
  | "organization_admin"
  | "editor_in_chief"
  | "managing_editor"
  | "editor"
  | "reviewer"
  | "production_editor";

export interface JournalAccess {
  organizationId: string;
  journalId: string;
  roles: JournalRole[];
}

export interface JournalWorkspaceAccess extends JournalAccess {
  organizationName: string;
  organizationSlug: string;
  journalTitle: string;
  journalSlug: string;
}

export interface JournalStaffMember {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: Exclude<JournalRole, "organization_admin">;
  createdAt: Date;
}

export interface TenancyTransaction {
  isPlatformOperator(userId: string): Promise<boolean>;
  isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean>;
  insertOrganization(input: OrganizationInput): Promise<OrganizationSummary>;
  insertOrganizationMembership(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  insertJournal(
    userId: string,
    input: JournalInput,
  ): Promise<JournalSummary>;
  findJournal(
    organizationId: string,
    journalId: string,
  ): Promise<JournalSummary | null>;
  publishJournal(
    organizationId: string,
    journalId: string,
    publishedAt: Date,
  ): Promise<JournalSummary | null>;
  updateJournalProfile(
    organizationId: string,
    journalId: string,
    input: Pick<
      UpdateJournalProfileInput,
      "description" | "aimsScope" | "authorGuidelines"
    >,
  ): Promise<JournalSummary | null>;
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  insertJournalRole(
    actorUserId: string,
    targetUserId: string,
    input: GrantJournalRoleInput,
  ): Promise<string>;
  revokeJournalRole(journalId: string, membershipId: string): Promise<boolean>;
  insertAuditEvent(event: AuditEventInput): Promise<void>;
}

export interface TenancyRepository {
  transaction<T>(
    work: (transaction: TenancyTransaction) => Promise<T>,
  ): Promise<T>;
  isPlatformOperator(userId: string): Promise<boolean>;
  listOrganizationsForUser(userId: string): Promise<OrganizationSummary[]>;
  getJournalAccess(
    userId: string,
    journalId: string,
  ): Promise<JournalAccess | null>;
  listJournalWorkspacesForUser(userId: string): Promise<JournalWorkspaceAccess[]>;
  listJournalStaff(
    actorUserId: string,
    organizationId: string,
    journalId: string,
  ): Promise<JournalStaffMember[]>;
  getOrganizationWorkspace(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationWorkspace | null>;
  getPublishedJournal(
    organizationSlug: string,
    journalSlug: string,
  ): Promise<PublishedJournal | null>;
  getPublishedJournalReference(
    organizationSlug: string,
    journalSlug: string,
  ): Promise<PublishedJournalReference | null>;
  listPublishedJournals(
    offset: number,
    limit: number,
    searchTerm?: string,
  ): Promise<PublishedJournalCatalogItem[]>;
}
