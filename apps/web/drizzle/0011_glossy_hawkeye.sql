CREATE TABLE "article_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"authors" jsonb NOT NULL,
	"doi" text,
	"manuscript_file_id" uuid,
	"xml_content" text,
	"pdf_file_id" uuid,
	"html_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" text,
	CONSTRAINT "article_version_status_valid" CHECK ("article_version"."status" in ('draft', 'in_copyedit', 'in_typeset', 'proof_ready', 'proof_approved', 'published', 'withdrawn')),
	CONSTRAINT "article_version_version_positive" CHECK ("article_version"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "doi_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"doi" text NOT NULL,
	"prefix" text NOT NULL,
	"suffix" text NOT NULL,
	"xml" text NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"issue_id" uuid NOT NULL,
	"page_start" integer,
	"page_end" integer,
	"order" integer NOT NULL,
	"article_type" text,
	CONSTRAINT "issue_article_order_positive" CHECK ("issue_article"."order" > 0)
);
--> statement-breakpoint
CREATE TABLE "issue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"volume_id" uuid,
	"number" integer NOT NULL,
	"year" integer NOT NULL,
	"label" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"cover_image_file_id" uuid,
	"description" text,
	"published_at" timestamp with time zone,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_status_valid" CHECK ("issue"."status" in ('planned', 'in_progress', 'published', 'archived')),
	CONSTRAINT "issue_number_positive" CHECK ("issue"."number" > 0),
	CONSTRAINT "issue_year_valid" CHECK ("issue"."year" >= 1900 and "issue"."year" <= 2100)
);
--> statement-breakpoint
CREATE TABLE "volume" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"year" integer NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "volume_number_positive" CHECK ("volume"."number" > 0),
	CONSTRAINT "volume_year_valid" CHECK ("volume"."year" >= 1900 and "volume"."year" <= 2100)
);
--> statement-breakpoint
ALTER TABLE "article_version" ADD CONSTRAINT "article_version_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_version" ADD CONSTRAINT "article_version_manuscript_file_id_submission_manuscript_id_fk" FOREIGN KEY ("manuscript_file_id") REFERENCES "public"."submission_manuscript"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_version" ADD CONSTRAINT "article_version_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doi_registration" ADD CONSTRAINT "doi_registration_article_id_article_version_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_article" ADD CONSTRAINT "issue_article_article_id_article_version_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_article" ADD CONSTRAINT "issue_article_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_journal_id_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_volume_id_volume_id_fk" FOREIGN KEY ("volume_id") REFERENCES "public"."volume"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volume" ADD CONSTRAINT "volume_journal_id_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_version_submission_version_unique" ON "article_version" USING btree ("submission_id","version");--> statement-breakpoint
CREATE INDEX "article_version_submission_idx" ON "article_version" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "article_version_status_idx" ON "article_version" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "doi_registration_article_unique" ON "doi_registration" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doi_registration_doi_unique" ON "doi_registration" USING btree ("doi");--> statement-breakpoint
CREATE INDEX "doi_registration_prefix_idx" ON "doi_registration" USING btree ("prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_article_article_unique" ON "issue_article" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_article_issue_order_unique" ON "issue_article" USING btree ("issue_id","order");--> statement-breakpoint
CREATE INDEX "issue_article_issue_idx" ON "issue_article" USING btree ("issue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_journal_volume_number_year_unique" ON "issue" USING btree ("journal_id","volume_id","number","year");--> statement-breakpoint
CREATE INDEX "issue_journal_idx" ON "issue" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "issue_volume_idx" ON "issue" USING btree ("volume_id");--> statement-breakpoint
CREATE INDEX "issue_status_idx" ON "issue" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "volume_journal_number_unique" ON "volume" USING btree ("journal_id","number");--> statement-breakpoint
CREATE INDEX "volume_journal_idx" ON "volume" USING btree ("journal_id");