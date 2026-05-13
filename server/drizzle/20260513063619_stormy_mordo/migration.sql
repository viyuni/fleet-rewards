ALTER TABLE "admins" DROP CONSTRAINT "admins_username_key";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_key";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_phone_hash_key";