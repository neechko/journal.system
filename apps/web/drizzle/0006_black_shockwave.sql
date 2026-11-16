CREATE TABLE "submission_manuscript" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_manuscript_version_positive" CHECK ("submission_manuscript"."version" > 0),
	CONSTRAINT "submission_manuscript_pdf_only" CHECK ("submission_manuscript"."content_type" = 'application/pdf'),
	CONSTRAINT "submission_manuscript_size_valid" CHECK ("submission_manuscript"."byte_size" > 0 and "submission_manuscript"."byte_size" <= 10485760),
	CONSTRAINT "submission_manuscript_sha256_format" CHECK ("submission_manuscript"."sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "submission_manuscript" ADD CONSTRAINT "submission_manuscript_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_manuscript" ADD CONSTRAINT "submission_manuscript_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_manuscript_storage_key_unique" ON "submission_manuscript" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_manuscript_version_unique" ON "submission_manuscript" USING btree ("submission_id","version");--> statement-breakpoint
CREATE INDEX "submission_manuscript_submission_idx" ON "submission_manuscript" USING btree ("submission_id","version");