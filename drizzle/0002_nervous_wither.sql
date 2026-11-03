ALTER TABLE "category" DROP CONSTRAINT "category_name_pln_uq";--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_name_eng_uq";--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "name_pln" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "name_eng" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_pln_uq" ON "category" USING btree (lower("name_pln"));--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_eng_uq" ON "category" USING btree (lower("name_eng"));--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_pln_uq" ON "tag" USING btree (lower("name_pln"));--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_eng_uq" ON "tag" USING btree (lower("name_eng"));