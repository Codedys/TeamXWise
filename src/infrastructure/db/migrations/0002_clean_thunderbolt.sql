ALTER TABLE "chip_ins" ADD COLUMN "is_activated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chip_ins" ADD COLUMN "preferences" jsonb NOT NULL;