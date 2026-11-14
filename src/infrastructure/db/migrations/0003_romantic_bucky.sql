ALTER TABLE "chip_in_payments" ADD COLUMN "answer" text;--> statement-breakpoint
ALTER TABLE "chip_in_payments" ADD COLUMN "created_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "chip_in_payments" ADD COLUMN "paid_at" timestamp with time zone;