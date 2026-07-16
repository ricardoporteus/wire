CREATE TABLE "doc_events" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"phase" varchar(16) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doc_events" ADD CONSTRAINT "doc_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_events_doc_idx" ON "doc_events" USING btree ("document_id","seq");