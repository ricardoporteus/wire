CREATE TYPE "public"."doc_format" AS ENUM('article', 'listicle', 'how_to', 'lesson', 'tutorial', 'testimonial', 'faq_page');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('diagnosing', 'awaiting_confirm', 'generating', 'draft', 'final', 'archived');--> statement-breakpoint
CREATE TYPE "public"."export_kind" AS ENUM('linkedin_article', 'linkedin_post', 'x_caption', 'instagram_caption', 'facebook_caption', 'newsletter_block', 'markdown', 'html', 'docx');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('suggested', 'queued', 'drafting', 'in_review', 'published', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."ledger_reason" AS ENUM('intelligence_run', 'diagnosis', 'generation', 'regeneration', 'repurpose', 'top_up', 'plan_grant', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'researching_keywords', 'analyzing_competitors', 'finding_gaps', 'finding_aeo', 'compiling', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."run_trigger" AS ENUM('onboarding', 'scheduled', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('pasted_text', 'file_upload', 'web_url', 'audio_link', 'video_link', 'voice_note');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('pending', 'fetching', 'transcribing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "brand_brains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"site_url" text NOT NULL,
	"what_they_do" text NOT NULL,
	"differentiator" text,
	"icp" jsonb NOT NULL,
	"competitors" jsonb NOT NULL,
	"voice" jsonb NOT NULL,
	"vocabulary" jsonb NOT NULL,
	"values" jsonb NOT NULL,
	"approved_facts" jsonb DEFAULT '[]'::jsonb,
	"ethics_rules" jsonb DEFAULT '[]'::jsonb,
	"formats" jsonb NOT NULL,
	"wizard_completed_at" timestamp with time zone,
	"ai_drafted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"run_id" uuid,
	"title" text NOT NULL,
	"format" "doc_format" NOT NULL,
	"target_keyword_id" uuid,
	"target_aeo_question" text,
	"why_now" text,
	"rank" integer DEFAULT 99 NOT NULL,
	"status" "idea_status" DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"source_id" uuid,
	"idea_id" uuid,
	"format" "doc_format" NOT NULL,
	"status" "doc_status" DEFAULT 'diagnosing' NOT NULL,
	"diagnosis" jsonb,
	"title" text,
	"body_markdown" text,
	"brief" jsonb,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"kind" "export_kind" NOT NULL,
	"content" text,
	"file_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"trigger" "run_trigger" NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"inngest_run_id" varchar(128),
	"competitor_intel" jsonb,
	"trends" jsonb,
	"best_practices" jsonb,
	"error" text,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"run_id" uuid,
	"phrase" text NOT NULL,
	"intent" varchar(24) NOT NULL,
	"difficulty" varchar(12),
	"priority" integer DEFAULT 3 NOT NULL,
	"rationale" text,
	"aeo_format" varchar(24),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"plan_slug" varchar(32) DEFAULT 'trial' NOT NULL,
	"credits_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_id" uuid NOT NULL,
	"kind" "source_kind" NOT NULL,
	"status" "source_status" DEFAULT 'pending' NOT NULL,
	"original_url" text,
	"file_key" text,
	"normalized_text" text,
	"meta" jsonb,
	"error" text,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"brain_id" uuid,
	"reason" "ledger_reason" NOT NULL,
	"credits" integer NOT NULL,
	"ref_type" varchar(24),
	"ref_id" uuid,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cost_usd_micros" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_brains" ADD CONSTRAINT "brand_brains_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_run_id_intelligence_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."intelligence_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_target_keyword_id_keywords_id_fk" FOREIGN KEY ("target_keyword_id") REFERENCES "public"."keywords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_idea_id_content_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."content_ideas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_runs" ADD CONSTRAINT "intelligence_runs_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_run_id_intelligence_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."intelligence_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_brain_id_brand_brains_id_fk" FOREIGN KEY ("brain_id") REFERENCES "public"."brand_brains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_brains_org_idx" ON "brand_brains" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ideas_brain_idx" ON "content_ideas" USING btree ("brain_id");--> statement-breakpoint
CREATE INDEX "documents_brain_idx" ON "documents" USING btree ("brain_id");--> statement-breakpoint
CREATE INDEX "exports_doc_idx" ON "exports" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "runs_brain_idx" ON "intelligence_runs" USING btree ("brain_id");--> statement-breakpoint
CREATE INDEX "keywords_brain_idx" ON "keywords" USING btree ("brain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "keywords_brain_phrase_uq" ON "keywords" USING btree ("brain_id","phrase");--> statement-breakpoint
CREATE INDEX "sources_brain_idx" ON "sources" USING btree ("brain_id");--> statement-breakpoint
CREATE INDEX "ledger_org_idx" ON "usage_ledger" USING btree ("org_id","created_at");