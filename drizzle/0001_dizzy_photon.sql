CREATE TABLE "art_piece_tags" (
	"art_piece_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "art_piece_tags_pk" PRIMARY KEY("art_piece_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "art_piece" (
	"art_piece_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"title_pln" text,
	"title_eng" text,
	"dimensions" text,
	"year_of_execution" integer,
	"mini_description_pln" jsonb,
	"mini_description_eng" jsonb,
	"description_pln" jsonb,
	"description_eng" jsonb,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grid_width" integer DEFAULT 1,
	"grid_height" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "category" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name_pln" text NOT NULL,
	"name_eng" text NOT NULL,
	CONSTRAINT "category_user_name_pln_uq" UNIQUE("user_id","name_pln"),
	CONSTRAINT "category_user_name_eng_uq" UNIQUE("user_id","name_eng")
);
--> statement-breakpoint
CREATE TABLE "email_verification_token" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"link_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"media_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"art_piece_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"profile_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"bio_pln" jsonb,
	"bio_eng" jsonb,
	"profile_image_url" text,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"site_settings_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" jsonb,
	"layout_bento_box" jsonb,
	"layout_category_view" jsonb,
	CONSTRAINT "site_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"tag_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name_pln" text,
	"name_eng" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "art_piece_tags" ADD CONSTRAINT "art_piece_tags_art_piece_fk" FOREIGN KEY ("art_piece_id") REFERENCES "public"."art_piece"("art_piece_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "art_piece_tags" ADD CONSTRAINT "art_piece_tags_tag_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "art_piece" ADD CONSTRAINT "art_piece_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "art_piece" ADD CONSTRAINT "art_piece_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_verification_token" ADD CONSTRAINT "email_verification_token_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("profile_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_art_piece_fk" FOREIGN KEY ("art_piece_id") REFERENCES "public"."art_piece"("art_piece_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");