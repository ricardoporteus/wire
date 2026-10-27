CREATE TYPE "public"."batch_status" AS ENUM('writing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "write_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"status" "batch_status" DEFAULT 'writing' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"notify_email" text,
	"notified_at" timestamp with time zone,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "write_batches" ADD CONSTRAINT "write_batches_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_batches" ADD CONSTRAINT "write_batches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "write_batches_org_idx" ON "write_batches" USING btree ("org_id","created_at");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_batch_id_write_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."write_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_batch_idx" ON "documents" USING btree ("batch_id");