-- Existing URL-backed media is intentionally disposable and must be reseeded.
DELETE FROM "media";
--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "file_url";
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "content" bytea NOT NULL;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "content_hash" text NOT NULL;
