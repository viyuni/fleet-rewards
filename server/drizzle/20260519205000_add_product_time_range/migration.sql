ALTER TABLE "products" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "end_time" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "products_time_range_idx" ON "products" ("start_time","end_time");--> statement-breakpoint
