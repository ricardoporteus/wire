CREATE TYPE "public"."demo_scan_status" AS ENUM('queued', 'scraping', 'drafting', 'measuring', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "demo_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"url" text NOT NULL,
	"domain" varchar(255) NOT NULL,
	"email" varchar(255),
	"status" "demo_scan_status" DEFAULT 'queued' NOT NULL,
	"result" jsonb,
	"brain_draft" jsonb,
	"error" text,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cost_usd_micros" integer DEFAULT 0 NOT NULL,
	"claimed_by_org_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "demo_scans_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "keyword_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"location_name" varchar(64) NOT NULL,
	"language_code" varchar(8) NOT NULL,
	"search_volume" integer,
	"kd" integer,
	"cpc" real,
	"intent" varchar(16),
	"trend" jsonb DEFAULT '[]'::jsonb,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demo_scans" ADD CONSTRAINT "demo_scans_claimed_by_org_id_organizations_id_fk" FOREIGN KEY ("claimed_by_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "demo_scans_token_uq" ON "demo_scans" USING btree ("token");--> statement-breakpoint
CREATE INDEX "demo_scans_domain_idx" ON "demo_scans" USING btree ("domain","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "keyword_metrics_uq" ON "keyword_metrics" USING btree ("keyword","location_name","language_code");--> statement-breakpoint
CREATE INDEX "keyword_metrics_measured_idx" ON "keyword_metrics" USING btree ("measured_at");