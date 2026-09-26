ALTER TABLE "keywords" ADD COLUMN "search_volume" integer;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "kd" integer;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "cpc" real;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "trend" jsonb;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "search_intent" varchar(16);--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "fit" integer;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "variants" jsonb;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "serp" jsonb;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "recommended_format" varchar(24);--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "metrics_source" varchar(12);--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "measured_at" timestamp with time zone;