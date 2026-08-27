ALTER TABLE "category" DROP CONSTRAINT "category_user_name_pln_uq";--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_user_name_eng_uq";--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_user_id_unique";--> statement-breakpoint
ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_user_id_unique";--> statement-breakpoint
ALTER TABLE "art_piece" DROP CONSTRAINT "art_piece_user_fk";
--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_user_fk";
--> statement-breakpoint
ALTER TABLE "links" DROP CONSTRAINT "links_profile_fk";
--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_user_fk";
--> statement-breakpoint
ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_user_fk";
--> statement-breakpoint
ALTER TABLE "tag" DROP CONSTRAINT "tag_user_fk";
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "content" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "content_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "is_singleton" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "is_singleton" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_singleton" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "art_piece" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "art_piece" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "art_piece" DROP COLUMN "grid_width";--> statement-breakpoint
ALTER TABLE "art_piece" DROP COLUMN "grid_height";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "links" DROP COLUMN "profile_id";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "tag" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_name_pln_uq" UNIQUE("name_pln");--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_name_eng_uq" UNIQUE("name_eng");--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_singleton_uq" UNIQUE("is_singleton");--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_singleton_uq" UNIQUE("is_singleton");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_singleton_uq" UNIQUE("is_singleton");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_content_hash_format_chk" CHECK ("media"."content_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_singleton_val_chk" CHECK ("profile"."is_singleton" = true);--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_singleton_val_chk" CHECK ("site_settings"."is_singleton" = true);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_singleton_val_chk" CHECK ("users"."is_singleton" = true);
