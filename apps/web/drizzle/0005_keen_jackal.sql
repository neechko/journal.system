CREATE TABLE "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_status_draft_only" CHECK ("submission"."status" = 'draft')
);
--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_journal_id_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submission_author_created_idx" ON "submission" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX "submission_journal_idx" ON "submission" USING btree ("journal_id");