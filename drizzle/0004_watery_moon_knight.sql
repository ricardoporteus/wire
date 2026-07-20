ALTER TABLE "keywords" ADD COLUMN "source" varchar(8) DEFAULT 'ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "keywords" ADD COLUMN "user_modified_at" timestamp with time zone;