import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("email_verified", {
      mode: "date",
      withTimezone: true,
    }),
    image: text("image"),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.providerAccountId],
      name: "account_provider_provider_account_id_pk",
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.identifier, table.token],
      name: "verification_token_identifier_token_pk",
    }),
  ],
);

export const platformOperators = pgTable("platform_operator", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const organizations = pgTable(
  "organization",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_slug_unique").on(table.slug),
    check(
      "organization_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
  ],
);

export const organizationMemberships = pgTable(
  "organization_membership",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.userId],
      name: "organization_membership_organization_user_pk",
    }),
    index("organization_membership_user_idx").on(table.userId),
    check(
      "organization_membership_role_valid",
      sql`${table.role} in ('organization_admin')`,
    ),
  ],
);

export const journals = pgTable(
  "journal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    aimsScope: text("aims_scope"),
    authorGuidelines: text("author_guidelines"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    uniqueIndex("journal_organization_slug_unique").on(
      table.organizationId,
      table.slug,
    ),
    index("journal_organization_idx").on(table.organizationId),
    check(
      "journal_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
  ],
);

export const submissions = pgTable(
  "submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "restrict" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    abstract: text("abstract"),
    keywords: text("keywords")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: text("status")
      .$type<
        | "draft"
        | "submitted"
        | "under_review"
        | "revision_requested"
        | "accepted"
        | "rejected"
        | "withdrawn"
      >()
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", {
      mode: "date",
      withTimezone: true,
    }),
    submittedManuscriptVersion: integer("submitted_manuscript_version"),
    rejectedAt: timestamp("rejected_at", { mode: "date", withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
    revisionRequestedAt: timestamp("revision_requested_at", { mode: "date", withTimezone: true }),
    revisionReason: text("revision_reason"),
    withdrawnAt: timestamp("withdrawn_at", { mode: "date", withTimezone: true }),
    withdrawalReason: text("withdrawal_reason"),
  },
  (table) => [
    index("submission_author_created_idx").on(
      table.createdBy,
      table.createdAt,
    ),
    index("submission_journal_idx").on(table.journalId),
    index("submission_status_idx").on(table.status),
    check(
      "submission_status_submitted_at_consistent",
      sql`(${table.status} = 'draft' and ${table.submittedAt} is null and ${table.submittedManuscriptVersion} is null) or (${table.status} in ('submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') and ${table.submittedAt} is not null and ${table.submittedManuscriptVersion} is not null and ${table.submittedManuscriptVersion} > 0)`,
    ),
    check(
      "submission_keyword_count_valid",
      sql`cardinality(${table.keywords}) <= 20`,
    ),
  ],
);

export const submissionManuscripts = pgTable(
  "submission_manuscript",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type")
      .$type<"application/pdf">()
      .notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    uploadedAt: timestamp("uploaded_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submission_manuscript_storage_key_unique").on(
      table.storageKey,
    ),
    uniqueIndex("submission_manuscript_version_unique").on(
      table.submissionId,
      table.version,
    ),
    index("submission_manuscript_submission_idx").on(
      table.submissionId,
      table.version,
    ),
    check("submission_manuscript_version_positive", sql`${table.version} > 0`),
    check(
      "submission_manuscript_pdf_only",
      sql`${table.contentType} = 'application/pdf'`,
    ),
    check(
      "submission_manuscript_size_valid",
      sql`${table.byteSize} > 0 and ${table.byteSize} <= 10485760`,
    ),
    check(
      "submission_manuscript_sha256_format",
      sql`${table.sha256} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const auditEvents = pgTable(
  "audit_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorLabel: text("actor_label"),
    actorType: text("actor_type"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    reason: text("reason").notNull(),
    stateBefore: text("state_before"),
    stateAfter: text("state_after"),
    source: text("source"),
    correlationId: uuid("correlation_id"),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_event_organization_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
    check(
      "audit_event_actor_present",
      sql`${table.actorUserId} is not null or nullif(${table.actorLabel}, '') is not null`,
    ),
    check(
      "audit_event_actor_type_valid",
      sql`${table.actorType} is null or ${table.actorType} in ('human', 'system', 'ai')`,
    ),
    check(
      "audit_event_submission_transition_complete",
      sql`${table.action} <> 'submission.submitted' or (${table.stateBefore} is not null and ${table.stateBefore} = 'draft' and ${table.stateAfter} is not null and ${table.stateAfter} = 'submitted' and ${table.actorType} = 'human' and ${table.source} is not null and ${table.source} = 'author_workspace' and ${table.correlationId} is not null)`,
    ),
  ],
);

export const submissionAuthors = pgTable(
  "submission_author",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    affiliation: text("affiliation"),
    orcid: text("orcid"),
    isCorresponding: text("is_corresponding").$type<boolean>().notNull().default(false),
    authorOrder: integer("author_order").notNull(),
  },
  (table) => [
    index("submission_author_submission_idx").on(table.submissionId),
    index("submission_author_user_idx").on(table.userId),
    uniqueIndex("submission_author_order_unique").on(table.submissionId, table.authorOrder),
  ],
);

export const reviewerAssignments = pgTable(
  "reviewer_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    reviewerUserId: text("reviewer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: text("role")
      .$type<"reviewer" | "statistical_reviewer" | "ethics_reviewer">()
      .notNull()
      .default("reviewer"),
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    dueAt: timestamp("due_at", { mode: "date", withTimezone: true }),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    unassignedAt: timestamp("unassigned_at", { mode: "date", withTimezone: true }),
    unassignedBy: text("unassigned_by").references(() => users.id, { onDelete: "set null" }),
    unassignedReason: text("unassigned_reason"),
    isBlind: text("is_blind").$type<boolean>().notNull().default(true),
  },
  (table) => [
    index("reviewer_assignment_submission_idx").on(table.submissionId),
    index("reviewer_assignment_reviewer_idx").on(table.reviewerUserId),
    index("reviewer_assignment_assigned_by_idx").on(table.assignedBy),
    check(
      "reviewer_assignment_role_valid",
      sql`${table.role} in ('reviewer', 'statistical_reviewer', 'ethics_reviewer')`,
    ),
  ],
);

export const reviewReports = pgTable(
  "review_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => reviewerAssignments.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    reviewerUserId: text("reviewer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    recommendation: text("recommendation")
      .$type<"accept" | "minor_revision" | "major_revision" | "reject">()
      .notNull(),
    commentsToAuthor: text("comments_to_author").notNull(),
    commentsToEditor: text("comments_to_editor"),
    scores: jsonb("scores"),
    submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    acknowledgedAt: timestamp("acknowledged_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    uniqueIndex("review_report_assignment_version_unique").on(table.assignmentId, table.version),
    index("review_report_submission_idx").on(table.submissionId),
    index("review_report_reviewer_idx").on(table.reviewerUserId),
    check(
      "review_report_recommendation_valid",
      sql`${table.recommendation} in ('accept', 'minor_revision', 'major_revision', 'reject')`,
    ),
    check("review_report_version_positive", sql`${table.version} > 0`),
  ],
);

export const editorialDecisions = pgTable(
  "editorial_decision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    editorUserId: text("editor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    outcome: text("outcome")
      .$type<"accept" | "minor_revision" | "major_revision" | "reject">()
      .notNull(),
    rationale: text("rationale").notNull(),
    reviewerRecommendations: jsonb("reviewer_recommendations").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    communicatedAt: timestamp("communicated_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    index("editorial_decision_submission_idx").on(table.submissionId),
    index("editorial_decision_editor_idx").on(table.editorUserId),
    check(
      "editorial_decision_outcome_valid",
      sql`${table.outcome} in ('accept', 'minor_revision', 'major_revision', 'reject')`,
    ),
  ],
);

export const articleVersions = pgTable(
  "article_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: text("status")
      .$type<
        | "draft"
        | "in_copyedit"
        | "in_typeset"
        | "proof_ready"
        | "proof_approved"
        | "published"
        | "withdrawn"
      >()
      .notNull()
      .default("draft"),
    title: text("title").notNull(),
    abstract: text("abstract"),
    keywords: text("keywords")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    authors: jsonb("authors").notNull(),
    doi: text("doi"),
    manuscriptFileId: uuid("manuscript_file_id").references(() => submissionManuscripts.id, { onDelete: "set null" }),
    xmlContent: text("xml_content"),
    pdfFileId: uuid("pdf_file_id"),
    htmlContent: text("html_content"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { mode: "date", withTimezone: true }),
    publishedBy: text("published_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("article_version_submission_version_unique").on(table.submissionId, table.version),
    index("article_version_submission_idx").on(table.submissionId),
    index("article_version_status_idx").on(table.status),
    check(
      "article_version_status_valid",
      sql`${table.status} in ('draft', 'in_copyedit', 'in_typeset', 'proof_ready', 'proof_approved', 'published', 'withdrawn')`,
    ),
    check("article_version_version_positive", sql`${table.version} > 0`),
  ],
);

export const volumes = pgTable(
  "volume",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    year: integer("year").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("volume_journal_number_unique").on(table.journalId, table.number),
    index("volume_journal_idx").on(table.journalId),
    check("volume_number_positive", sql`${table.number} > 0`),
    check("volume_year_valid", sql`${table.year} >= 1900 and ${table.year} <= 2100`),
  ],
);

export const issues = pgTable(
  "issue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    volumeId: uuid("volume_id").references(() => volumes.id, { onDelete: "set null" }),
    number: integer("number").notNull(),
    year: integer("year").notNull(),
    label: text("label"),
    status: text("status")
      .$type<"planned" | "in_progress" | "published" | "archived">()
      .notNull()
      .default("planned"),
    coverImageFileId: uuid("cover_image_file_id"),
    description: text("description"),
    publishedAt: timestamp("published_at", { mode: "date", withTimezone: true }),
    publishedBy: text("published_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("issue_journal_volume_number_year_unique").on(table.journalId, table.volumeId, table.number, table.year),
    index("issue_journal_idx").on(table.journalId),
    index("issue_volume_idx").on(table.volumeId),
    index("issue_status_idx").on(table.status),
    check(
      "issue_status_valid",
      sql`${table.status} in ('planned', 'in_progress', 'published', 'archived')`,
    ),
    check("issue_number_positive", sql`${table.number} > 0`),
    check("issue_year_valid", sql`${table.year} >= 1900 and ${table.year} <= 2100`),
  ],
);

export const issueArticles = pgTable(
  "issue_article",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articleVersions.id, { onDelete: "cascade" }),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    order: integer("order").notNull(),
    articleType: text("article_type"),
  },
  (table) => [
    uniqueIndex("issue_article_article_unique").on(table.articleId),
    uniqueIndex("issue_article_issue_order_unique").on(table.issueId, table.order),
    index("issue_article_issue_idx").on(table.issueId),
    check("issue_article_order_positive", sql`${table.order} > 0`),
  ],
);

export const doiRegistrations = pgTable(
  "doi_registration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articleVersions.id, { onDelete: "cascade" }),
    doi: text("doi").notNull(),
    prefix: text("prefix").notNull(),
    suffix: text("suffix").notNull(),
    xml: text("xml").notNull(),
    registeredAt: timestamp("registered_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("doi_registration_article_unique").on(table.articleId),
    uniqueIndex("doi_registration_doi_unique").on(table.doi),
    index("doi_registration_prefix_idx").on(table.prefix),
  ],
);

