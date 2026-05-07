ALTER TABLE "admins" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "admin_role";--> statement-breakpoint
CREATE TYPE "admin_role" AS ENUM('admin', 'superAdmin');--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "role" SET DATA TYPE "admin_role" USING "role"::"admin_role";--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'admin'::"admin_role";--> statement-breakpoint
CREATE UNIQUE INDEX "admins_single_superAdmin_unique" ON "admins" ("role") WHERE "role" = 'superAdmin';