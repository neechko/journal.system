CREATE TABLE "editorial_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"editor_user_id" text NOT NULL,
	"outcome" text NOT NULL,
	"rationale" text NOT NULL,
	"reviewer_recommendations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"communicated_at" timestamp with time zone,
	CONSTRAINT "editorial_decision_outcome_valid" CHECK ("editorial_decision"."outcome" in ('accept', 'minor_revision', 'major_revision', 'reject'))
);
--> statement-breakpoint
CREATE TABLE "review_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"version" integer NOT NULL,
	"recommendation" text NOT NULL,
	"comments_to_author" text NOT NULL,
	"comments_to_editor" text,
	"scores" jsonb,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	CONSTRAINT "review_report_recommendation_valid" CHECK ("review_report"."recommendation" in ('accept', 'minor_revision', 'major_revision', 'reject')),
	CONSTRAINT "review_report_version_positive" CHECK ("review_report"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "reviewer_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"role" text DEFAULT 'reviewer' NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"unassigned_at" timestamp with time zone,
	"unassigned_by" text,
	"unassigned_reason" text,
	"is_blind" text DEFAULT true NOT NULL,
	CONSTRAINT "reviewer_assignment_role_valid" CHECK ("reviewer_assignment"."role" in ('reviewer', 'statistical_reviewer', 'ethics_reviewer'))
);
--> statement-breakpoint
CREATE TABLE "submission_author" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"affiliation" text,
	"orcid" text,
	"is_corresponding" text DEFAULT false NOT NULL,
	"author_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submission" DROP CONSTRAINT "submission_status_submitted_at_consistent";--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "revision_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "revision_reason" text;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "withdrawal_reason" text;--> statement-breakpoint
ALTER TABLE "editorial_decision" ADD CONSTRAINT "editorial_decision_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_decision" ADD CONSTRAINT "editorial_decision_editor_user_id_user_id_fk" FOREIGN KEY ("editor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_report" ADD CONSTRAINT "review_report_assignment_id_reviewer_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."reviewer_assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_report" ADD CONSTRAINT "review_report_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_report" ADD CONSTRAINT "review_report_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_assignment" ADD CONSTRAINT "reviewer_assignment_unassigned_by_user_id_fk" FOREIGN KEY ("unassigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_author" ADD CONSTRAINT "submission_author_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_author" ADD CONSTRAINT "submission_author_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "editorial_decision_submission_idx" ON "editorial_decision" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "editorial_decision_editor_idx" ON "editorial_decision" USING btree ("editor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_report_assignment_version_unique" ON "review_report" USING btree ("assignment_id","version");--> statement-breakpoint
CREATE INDEX "review_report_submission_idx" ON "review_report" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "review_report_reviewer_idx" ON "review_report" USING btree ("reviewer_user_id");--> statement-breakpoint
CREATE INDEX "reviewer_assignment_submission_idx" ON "reviewer_assignment" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "reviewer_assignment_reviewer_idx" ON "reviewer_assignment" USING btree ("reviewer_user_id");--> statement-breakpoint
CREATE INDEX "reviewer_assignment_assigned_by_idx" ON "reviewer_assignment" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "submission_author_submission_idx" ON "submission_author" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_author_user_idx" ON "submission_author" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_author_order_unique" ON "submission_author" USING btree ("submission_id","author_order");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submission" USING btree ("status");--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_status_submitted_at_consistent" CHECK (("submission"."status" = 'draft' and "submission"."submitted_at" is null and "submission"."submitted_manuscript_version" is null) or ("submission"."status" in ('submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') and "submission"."submitted_at" is not null and "submission"."submitted_manuscript_version" is not null and "submission"."submitted_manuscript_version" > 0));