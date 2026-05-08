DROP INDEX "admins_single_superAdmin_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "admins_single_super_admin_unique" ON "admins" ("role") WHERE "role" = 'superAdmin';