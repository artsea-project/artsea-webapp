CREATE TABLE "art_piece_tags" (
	"art_piece_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "art_piece_tags_pk" PRIMARY KEY("art_piece_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "art_piece" (
	"art_piece_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"title_pln" text,
	"title_eng" text,
	"dimensions" text,
	"year_of_execution" integer,
	"mini_description_pln" jsonb,
	"mini_description_eng" jsonb,
	"description_pln" jsonb,
	"description_eng" jsonb,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_pln" text NOT NULL,
	"name_eng" text NOT NULL,
	CONSTRAINT "category_name_pln_uq" UNIQUE("name_pln"),
	CONSTRAINT "category_name_eng_uq" UNIQUE("name_eng")
);
--> statement-breakpoint
CREATE TABLE "links" (
	"link_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"media_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"art_piece_id" uuid NOT NULL,
	"content" "bytea" NOT NULL,
	"content_hash" text NOT NULL,
	"file_type" text NOT NULL,
	"order_index" integer NOT NULL,
	CONSTRAINT "media_content_hash_format_chk" CHECK ("media"."content_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"profile_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"bio_pln" jsonb,
	"bio_eng" jsonb,
	"contact_pln" jsonb,
	"contact_eng" jsonb,
	"profile_image_url" text,
	"is_singleton" boolean DEFAULT true NOT NULL,
	CONSTRAINT "profile_singleton_uq" UNIQUE("is_singleton"),
	CONSTRAINT "profile_singleton_val_chk" CHECK ("profile"."is_singleton" = true)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"site_settings_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme" jsonb,
	"layout_bento_box" jsonb,
	"layout_category_view" jsonb,
	"is_singleton" boolean DEFAULT true NOT NULL,
	CONSTRAINT "site_settings_singleton_uq" UNIQUE("is_singleton"),
	CONSTRAINT "site_settings_singleton_val_chk" CHECK ("site_settings"."is_singleton" = true)
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"tag_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_pln" text,
	"name_eng" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_singleton" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_singleton_uq" UNIQUE("is_singleton"),
	CONSTRAINT "users_singleton_val_chk" CHECK ("users"."is_singleton" = true)
);
--> statement-breakpoint
ALTER TABLE "art_piece_tags" ADD CONSTRAINT "art_piece_tags_art_piece_fk" FOREIGN KEY ("art_piece_id") REFERENCES "public"."art_piece"("art_piece_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "art_piece_tags" ADD CONSTRAINT "art_piece_tags_tag_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "art_piece" ADD CONSTRAINT "art_piece_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_art_piece_fk" FOREIGN KEY ("art_piece_id") REFERENCES "public"."art_piece"("art_piece_id") ON DELETE cascade ON UPDATE cascade;