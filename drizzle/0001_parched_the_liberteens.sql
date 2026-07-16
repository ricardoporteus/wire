CREATE TABLE "run_events" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"stage" varchar(32) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_id_intelligence_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."intelligence_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "run_events_run_idx" ON "run_events" USING btree ("run_id","seq");