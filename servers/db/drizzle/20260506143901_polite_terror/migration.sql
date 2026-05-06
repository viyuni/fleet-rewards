DROP TABLE "reward_campaigns";--> statement-breakpoint
ALTER TABLE "point_conversion_rules" DROP CONSTRAINT "point_conversion_rules_code_unique";--> statement-breakpoint
ALTER TABLE "point_types" DROP CONSTRAINT "point_types_name_key";--> statement-breakpoint
ALTER TABLE "reward_rules" DROP CONSTRAINT "reward_rules_code_unique";--> statement-breakpoint
DROP INDEX "reward_rules_scene_idx";--> statement-breakpoint
DROP INDEX "point_types_deleted_at_idx";--> statement-breakpoint
DROP INDEX "users_deleted_at_idx";--> statement-breakpoint
ALTER TABLE "point_transactions" ADD COLUMN "point_type_name_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reward_rules" ADD COLUMN "group" text;--> statement-breakpoint
ALTER TABLE "reward_rules" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reward_rules" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reward_rules" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "reward_rules" DROP COLUMN "scene";--> statement-breakpoint
ALTER TABLE "point_conversion_rules" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "point_types" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "point_types" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "reward_rules" ALTER COLUMN "enabled" SET DEFAULT false;--> statement-breakpoint
CREATE INDEX "reward_orders_user_created_at_idx" ON "orders" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reward_orders_status_created_at_idx" ON "orders" ("status","created_at");--> statement-breakpoint
CREATE INDEX "reward_orders_user_status_created_at_idx" ON "orders" ("user_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "point_conversion_rules_active_unique" ON "point_conversion_rules" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "point_transactions_user_created_at_idx" ON "point_transactions" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_type_created_at_idx" ON "point_transactions" ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_point_type_created_at_idx" ON "point_transactions" ("user_id","point_type_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_active_unique" ON "products" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_active_list_idx" ON "products" ("status","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_point_type_list_idx" ON "products" ("point_type_id","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_delivery_type_list_idx" ON "products" ("delivery_type","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_created_at_idx" ON "product_stock_transactions" ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_type_created_at_idx" ON "product_stock_transactions" ("product_id","type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_rules_active_unique" ON "reward_rules" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "reward_rules_group_idx" ON "reward_rules" ("group");--> statement-breakpoint
CREATE INDEX "reward_rules_time_range_idx" ON "reward_rules" ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "reward_rules_enabled_priority_created_at_idx" ON "reward_rules" ("enabled","priority","created_at");--> statement-breakpoint
CREATE INDEX "reward_rules_priority_created_at_idx" ON "reward_rules" ("priority","created_at");--> statement-breakpoint
DROP TYPE "bilibili_guard_level";--> statement-breakpoint
DROP TYPE "reward_rule_scene";--> statement-breakpoint
DROP TYPE "reward_campaign_effect";