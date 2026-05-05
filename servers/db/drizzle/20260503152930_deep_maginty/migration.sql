CREATE TYPE "admin_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'completed', 'refunded');--> statement-breakpoint
CREATE TYPE "point_account_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "point_transaction_type" AS ENUM('grant', 'consume', 'refund', 'adjust', 'reversal');--> statement-breakpoint
CREATE TYPE "point_type_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "product_delivery_type" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TYPE "reward_product_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "product_stock_movement_type" AS ENUM('consume', 'restore', 'adjust');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('normal', 'banned');--> statement-breakpoint
CREATE TYPE "bilibili_guard_level" AS ENUM('jz', 'td', 'zd');--> statement-breakpoint
CREATE TYPE "reward_rule_scene" AS ENUM('bilibili_guard');--> statement-breakpoint
CREATE TYPE "reward_campaign_effect" AS ENUM('multiply', 'add');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_uid" text NOT NULL CONSTRAINT "admins_bili_uid_unique" UNIQUE,
	"username" text NOT NULL UNIQUE,
	"status" "admin_status" DEFAULT 'active'::"admin_status" NOT NULL,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp,
	"remark" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_no" text NOT NULL CONSTRAINT "reward_orders_order_no_unique" UNIQUE,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"point_type_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"point_type_name_snapshot" text NOT NULL,
	"delivery_type_snapshot" "product_delivery_type" NOT NULL,
	"consume_transaction_id" uuid,
	"refund_transaction_id" uuid,
	"status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"receiver_phone_encrypted" text,
	"receiver_address_encrypted" text,
	"user_remark" text,
	"refund_reason" text,
	"completed_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"idempotency_key" text NOT NULL CONSTRAINT "reward_orders_idempotency_key_unique" UNIQUE,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"point_type_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"status" "point_account_status" DEFAULT 'active'::"point_account_status" NOT NULL,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_conversion_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL CONSTRAINT "point_conversion_rules_code_unique" UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"remark" text,
	"from_point_type_id" uuid NOT NULL,
	"to_point_type_id" uuid NOT NULL,
	"from_amount" integer NOT NULL,
	"to_amount" integer NOT NULL,
	"min_from_amount" integer,
	"max_from_amount" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"point_type_id" uuid NOT NULL,
	"type" "point_transaction_type" NOT NULL,
	"delta" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source_type" text,
	"source_id" text,
	"idempotency_key" text NOT NULL CONSTRAINT "point_transactions_idempotency_key_unique" UNIQUE,
	"remark" text,
	"metadata" jsonb,
	"reversal_of_transaction_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL CONSTRAINT "point_types_code_unique" UNIQUE,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"icon" text,
	"status" "point_type_status" DEFAULT 'active'::"point_type_status" NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"cover" text,
	"detail" text,
	"point_type_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"status" "reward_product_status" DEFAULT 'disabled'::"reward_product_status" NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"delivery_type" "product_delivery_type" DEFAULT 'manual'::"product_delivery_type" NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"type" "product_stock_movement_type" NOT NULL,
	"delta" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"idempotency_key" text NOT NULL CONSTRAINT "product_stock_transactions_idempotency_key_unique" UNIQUE,
	"remark" text,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_uid" text NOT NULL UNIQUE,
	"username" text NOT NULL UNIQUE,
	"status" "user_status" DEFAULT 'normal'::"user_status" NOT NULL,
	"password_hash" text NOT NULL,
	"phone_encrypted" text,
	"email_encrypted" text,
	"phone_hash" text UNIQUE,
	"address_encrypted" text,
	"remark" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL CONSTRAINT "reward_rules_code_unique" UNIQUE,
	"name" text NOT NULL,
	"remark" text,
	"scene" "reward_rule_scene" NOT NULL,
	"conditions" jsonb NOT NULL,
	"point_type_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL CONSTRAINT "reward_campaigns_code_unique" UNIQUE,
	"name" text NOT NULL,
	"remark" text,
	"scene" "reward_rule_scene" NOT NULL,
	"effect" "reward_campaign_effect" NOT NULL,
	"value" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"stackable" boolean DEFAULT false NOT NULL,
	"conditions" jsonb,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admins_status_idx" ON "admins" ("status");--> statement-breakpoint
CREATE INDEX "admins_deleted_at_idx" ON "admins" ("deleted_at");--> statement-breakpoint
CREATE INDEX "reward_orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX "reward_orders_product_id_idx" ON "orders" ("product_id");--> statement-breakpoint
CREATE INDEX "reward_orders_point_type_id_idx" ON "orders" ("point_type_id");--> statement-breakpoint
CREATE INDEX "reward_orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX "reward_orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "point_accounts_user_id_point_type_id_unique_idx" ON "point_accounts" ("user_id","point_type_id");--> statement-breakpoint
CREATE INDEX "point_accounts_user_id_idx" ON "point_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "point_accounts_point_type_id_idx" ON "point_accounts" ("point_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "point_conversion_rules_from_to_unique_idx" ON "point_conversion_rules" ("from_point_type_id","to_point_type_id");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_from_point_type_id_idx" ON "point_conversion_rules" ("from_point_type_id");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_to_point_type_id_idx" ON "point_conversion_rules" ("to_point_type_id");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_enabled_idx" ON "point_conversion_rules" ("enabled");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_time_range_idx" ON "point_conversion_rules" ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_id_idx" ON "point_transactions" ("user_id");--> statement-breakpoint
CREATE INDEX "point_transactions_point_account_id_idx" ON "point_transactions" ("account_id");--> statement-breakpoint
CREATE INDEX "point_transactions_point_type_id_idx" ON "point_transactions" ("point_type_id");--> statement-breakpoint
CREATE INDEX "point_transactions_type_idx" ON "point_transactions" ("type");--> statement-breakpoint
CREATE INDEX "point_transactions_source_idx" ON "point_transactions" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "point_transactions_created_at_idx" ON "point_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX "point_types_status_idx" ON "point_types" ("status");--> statement-breakpoint
CREATE INDEX "point_types_deleted_at_idx" ON "point_types" ("deleted_at");--> statement-breakpoint
CREATE INDEX "point_types_sort_idx" ON "point_types" ("sort");--> statement-breakpoint
CREATE INDEX "products_point_type_id_idx" ON "products" ("point_type_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" ("status");--> statement-breakpoint
CREATE INDEX "products_sort_idx" ON "products" ("sort");--> statement-breakpoint
CREATE INDEX "products_deleted_at_idx" ON "products" ("deleted_at");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_id_idx" ON "product_stock_transactions" ("product_id");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_type_idx" ON "product_stock_transactions" ("type");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_source_idx" ON "product_stock_transactions" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_created_at_idx" ON "product_stock_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" ("status");--> statement-breakpoint
CREATE INDEX "users_bili_uid_idx" ON "users" ("bili_uid");--> statement-breakpoint
CREATE INDEX "users_phone_hash_idx" ON "users" ("phone_hash");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");--> statement-breakpoint
CREATE INDEX "reward_rules_scene_idx" ON "reward_rules" ("scene");--> statement-breakpoint
CREATE INDEX "reward_rules_point_type_id_idx" ON "reward_rules" ("point_type_id");--> statement-breakpoint
CREATE INDEX "reward_rules_enabled_idx" ON "reward_rules" ("enabled");--> statement-breakpoint
CREATE INDEX "reward_rules_priority_idx" ON "reward_rules" ("priority");--> statement-breakpoint
CREATE INDEX "reward_campaigns_scene_idx" ON "reward_campaigns" ("scene");--> statement-breakpoint
CREATE INDEX "reward_campaigns_enabled_idx" ON "reward_campaigns" ("enabled");--> statement-breakpoint
CREATE INDEX "reward_campaigns_time_range_idx" ON "reward_campaigns" ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "reward_campaigns_priority_idx" ON "reward_campaigns" ("priority");--> statement-breakpoint
CREATE INDEX "reward_campaigns_deleted_at_idx" ON "reward_campaigns" ("deleted_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_accounts" ADD CONSTRAINT "point_accounts_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_conversion_rules" ADD CONSTRAINT "point_conversion_rules_from_point_type_id_point_types_id_fkey" FOREIGN KEY ("from_point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_conversion_rules" ADD CONSTRAINT "point_conversion_rules_to_point_type_id_point_types_id_fkey" FOREIGN KEY ("to_point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_account_id_point_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "point_accounts"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "product_stock_transactions" ADD CONSTRAINT "product_stock_transactions_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");