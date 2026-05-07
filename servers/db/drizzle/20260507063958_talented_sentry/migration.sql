ALTER TABLE "admins" DROP CONSTRAINT "admins_bili_uid_unique";--> statement-breakpoint
DROP INDEX "admins_deleted_at_idx";--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "uid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "bili_uid";--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_uid_unique" UNIQUE("uid");--> statement-breakpoint
CREATE INDEX "admins_created_at_idx" ON "admins" ("created_at");