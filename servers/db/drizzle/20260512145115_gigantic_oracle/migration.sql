ALTER TABLE "admins" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "admin_status";--> statement-breakpoint
CREATE TYPE "admin_status" AS ENUM('active', 'banned');--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "status" SET DATA TYPE "admin_status" USING "status"::"admin_status";--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "status" SET DEFAULT 'active'::"admin_status";--> statement-breakpoint
ALTER TABLE "point_accounts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "point_accounts" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "point_account_status";--> statement-breakpoint
CREATE TYPE "point_account_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
ALTER TABLE "point_accounts" ALTER COLUMN "status" SET DATA TYPE "point_account_status" USING "status"::"point_account_status";--> statement-breakpoint
ALTER TABLE "point_accounts" ALTER COLUMN "status" SET DEFAULT 'active'::"point_account_status";--> statement-breakpoint
ALTER TABLE "point_conversion_rules" DROP COLUMN "from_amount";