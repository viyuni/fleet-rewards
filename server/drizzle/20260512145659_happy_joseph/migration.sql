ALTER TABLE "point_conversion_rules" ADD COLUMN "min_convert_amount" integer;--> statement-breakpoint
ALTER TABLE "point_conversion_rules" ADD COLUMN "max_convert_amount" integer;--> statement-breakpoint
ALTER TABLE "point_conversion_rules" DROP COLUMN "min_from_amount";--> statement-breakpoint
ALTER TABLE "point_conversion_rules" DROP COLUMN "max_from_amount";