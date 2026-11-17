CREATE TABLE "journal_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "journal_membership_role_valid" CHECK ("journal_membership"."role" in ('editor_in_chief', 'managing_editor', 'editor', 'reviewer', 'production_editor'))
);
--> statement-breakpoint
ALTER TABLE "journal_membership" ADD CONSTRAINT "journal_membership_journal_id_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_membership" ADD CONSTRAINT "journal_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_membership" ADD CONSTRAINT "journal_membership_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "journal_membership_active_unique" ON "journal_membership" USING btree ("journal_id","user_id","role") WHERE "journal_membership"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "journal_membership_user_idx" ON "journal_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_membership_journal_idx" ON "journal_membership" USING btree ("journal_id");