CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"target_amount_minor_units" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
