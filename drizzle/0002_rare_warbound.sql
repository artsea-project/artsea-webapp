DROP TABLE "email_verification_token" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified_at";