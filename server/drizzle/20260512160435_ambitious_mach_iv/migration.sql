CREATE TYPE "bili_event_status" AS ENUM('processing', 'succeeded', 'failed', 'ignored');--> statement-breakpoint
CREATE TABLE "bili_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"bili_uid" text NOT NULL,
	"user_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"status" "bili_event_status" NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"processed_at" timestamp with time zone,
	"event_snapshot" jsonb NOT NULL,
	"reward_item_snapshots" jsonb DEFAULT '[]' NOT NULL,
	"reward_result_snapshots" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bili_events_bili_event_id_unique" ON "bili_events" ("bili_event_id");--> statement-breakpoint
CREATE INDEX "bili_events_bili_uid_idx" ON "bili_events" ("bili_uid");--> statement-breakpoint
CREATE INDEX "bili_events_user_id_idx" ON "bili_events" ("user_id");--> statement-breakpoint
CREATE INDEX "bili_events_status_idx" ON "bili_events" ("status");--> statement-breakpoint
CREATE INDEX "bili_events_occurred_at_idx" ON "bili_events" ("occurred_at");--> statement-breakpoint
ALTER TABLE "bili_events" ADD CONSTRAINT "bili_events_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");