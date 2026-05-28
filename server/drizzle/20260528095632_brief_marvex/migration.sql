ALTER TABLE "point_types" ALTER COLUMN "sort" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "point_types" ALTER COLUMN "sort" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sort" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sort" DROP NOT NULL;