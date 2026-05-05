ALTER TABLE "orders" DROP CONSTRAINT "reward_orders_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "point_transactions" DROP CONSTRAINT "point_transactions_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "point_types" DROP CONSTRAINT "point_types_code_unique";--> statement-breakpoint
ALTER TABLE "product_stock_transactions" DROP CONSTRAINT "product_stock_transactions_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "point_accounts" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "point_transactions" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "point_types" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "product_stock_transactions" DROP COLUMN "deleted_at";--> statement-breakpoint
CREATE UNIQUE INDEX "reward_orders_user_id_idempotency_key_unique" ON "orders" ("user_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "point_transactions_account_id_idempotency_key_unique" ON "point_transactions" ("account_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "point_transactions_reversal_of_transaction_id_unique" ON "point_transactions" ("reversal_of_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_stock_transactions_idempotency_unique" ON "product_stock_transactions" ("product_id","source_type","source_id","type","idempotency_key");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_consume_transaction_id_point_transactions_id_fkey" FOREIGN KEY ("consume_transaction_id") REFERENCES "point_transactions"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_refund_transaction_id_point_transactions_id_fkey" FOREIGN KEY ("refund_transaction_id") REFERENCES "point_transactions"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");