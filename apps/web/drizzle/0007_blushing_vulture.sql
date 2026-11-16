ALTER TABLE "submission" DROP CONSTRAINT "submission_status_draft_only";--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "actor_type" text;--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "state_before" text;--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "state_after" text;--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "correlation_id" uuid;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_type_valid" CHECK ("audit_event"."actor_type" is null or "audit_event"."actor_type" in ('human', 'system', 'ai'));--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_submission_transition_complete" CHECK ("audit_event"."action" <> 'submission.submitted' or ("audit_event"."state_before" is not null and "audit_event"."state_before" = 'draft' and "audit_event"."state_after" is not null and "audit_event"."state_after" = 'submitted' and "audit_event"."actor_type" = 'human' and "audit_event"."source" is not null and "audit_event"."source" = 'author_workspace' and "audit_event"."correlation_id" is not null));--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_status_submitted_at_consistent" CHECK (("submission"."status" = 'draft' and "submission"."submitted_at" is null) or ("submission"."status" = 'submitted' and "submission"."submitted_at" is not null));