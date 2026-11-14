CREATE TABLE "chip_in_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"chip_in_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chip_in_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"chip_in_id" text NOT NULL,
	"request_id" text NOT NULL,
	"participant_id" text,
	"payer_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"source_minor_units" integer NOT NULL,
	"source_currency" text NOT NULL,
	"pay_minor_units" integer NOT NULL,
	"pay_currency" text NOT NULL,
	"rate" double precision NOT NULL,
	"method" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chip_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_token" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"owner_name" text NOT NULL,
	"is_open" boolean NOT NULL,
	"invitation_message" text,
	"audience" text NOT NULL,
	"price_minor_units" integer NOT NULL,
	"currency" text NOT NULL,
	"deadline" text,
	"limit_type" text NOT NULL,
	"spot_limit" integer NOT NULL,
	"goal_minor_units" integer NOT NULL,
	"collect_email" boolean NOT NULL,
	"custom_question" text,
	"paid_spots" integer DEFAULT 0 NOT NULL,
	"received_minor_units" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chip_in_participants" ADD CONSTRAINT "chip_in_participants_chip_in_id_chip_ins_id_fk" FOREIGN KEY ("chip_in_id") REFERENCES "public"."chip_ins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chip_in_payments" ADD CONSTRAINT "chip_in_payments_chip_in_id_chip_ins_id_fk" FOREIGN KEY ("chip_in_id") REFERENCES "public"."chip_ins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chip_in_payments_chip_in_request_idx" ON "chip_in_payments" USING btree ("chip_in_id","request_id");