CREATE TYPE "admin_role" AS ENUM('admin', 'super_admin');--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "role" "admin_role" DEFAULT 'admin'::"admin_role" NOT NULL;--> statement-breakpoint
UPDATE "admins" SET "role" = 'super_admin'::"admin_role" WHERE "uid" = '0721';--> statement-breakpoint
CREATE INDEX "admins_role_idx" ON "admins" ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_single_super_admin_unique" ON "admins" ("role") WHERE "role" = 'super_admin'::"admin_role";
