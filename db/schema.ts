import {
    pgTable,
    text,
    jsonb,
    boolean,
    integer,
    timestamp,
    uuid,
    primaryKey,
    foreignKey,
    unique,
    check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import type { BioContent, ContactContent } from "../types/profile"
import type { SiteTheme } from "../types/theme"

// User Table
export const users = pgTable(
    "users",
    {
        userId: uuid("user_id").primaryKey().defaultRandom(),
        username: text("username").notNull().unique(),
        email: text("email").notNull().unique(),
        passwordHash: text("password_hash").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("users_singleton_uq").on(table.isSingleton),
        check("users_singleton_val_chk", sql`${table.isSingleton} = true`),
    ]
)

// Profile Table
export const profiles = pgTable(
    "profile",
    {
        profileId: uuid("profile_id").primaryKey().defaultRandom(),
        fullName: text("full_name").notNull(),
        bioPln: jsonb("bio_pln").$type<BioContent>(),
        bioEng: jsonb("bio_eng").$type<BioContent>(),
        contactPln: jsonb("contact_pln").$type<ContactContent>(),
        contactEng: jsonb("contact_eng").$type<ContactContent>(),
        profileImageUrl: text("profile_image_url"),
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("profile_singleton_uq").on(table.isSingleton),
        check("profile_singleton_val_chk", sql`${table.isSingleton} = true`),
    ]
)

// Links Table
export const links = pgTable("links", {
    linkId: uuid("link_id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    url: text("url").notNull(),
})

// Category Table
export const categories = pgTable(
    "category",
    {
        categoryId: uuid("category_id").primaryKey().defaultRandom(),
        namePln: text("name_pln").notNull(),
        nameEng: text("name_eng").notNull(),
    },
    (table) => [
        unique("category_name_pln_uq").on(table.namePln),
        unique("category_name_eng_uq").on(table.nameEng),
    ]
)

// Tag Table
export const tags = pgTable("tag", {
    tagId: uuid("tag_id").primaryKey().defaultRandom(),
    namePln: text("name_pln"),
    nameEng: text("name_eng"),
})

// Art Piece Table
export const artPieces = pgTable(
    "art_piece",
    {
        artPieceId: uuid("art_piece_id").primaryKey().defaultRandom(),
        categoryId: uuid("category_id").notNull(),
        isVisible: boolean("is_visible").notNull().default(true),
        titlePln: text("title_pln"),
        titleEng: text("title_eng"),
        dimensions: text("dimensions"),
        yearOfExecution: integer("year_of_execution"),
        miniDescriptionPln: jsonb("mini_description_pln"),
        miniDescriptionEng: jsonb("mini_description_eng"),
        descriptionPln: jsonb("description_pln"),
        descriptionEng: jsonb("description_eng"),
        uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.categoryId],
            foreignColumns: [categories.categoryId],
            name: "art_piece_category_fk",
        })
            .onDelete("restrict")
            .onUpdate("cascade"),
    ]
)

// Media Table
export const media = pgTable(
    "media",
    {
        mediaId: uuid("media_id").primaryKey().defaultRandom(),
        artPieceId: uuid("art_piece_id").notNull(),
        fileUrl: text("file_url").notNull(),
        fileType: text("file_type", { enum: ["png", "jpg", "gif", "mp4"] }).notNull(),
        orderIndex: integer("order_index").notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.artPieceId],
            foreignColumns: [artPieces.artPieceId],
            name: "media_art_piece_fk",
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
    ]
)

// Art Piece Tags (Join Table)
export const artPieceTags = pgTable(
    "art_piece_tags",
    {
        artPieceId: uuid("art_piece_id").notNull(),
        tagId: uuid("tag_id").notNull(),
    },
    (table) => [
        primaryKey({
            columns: [table.artPieceId, table.tagId],
            name: "art_piece_tags_pk",
        }),
        foreignKey({
            columns: [table.artPieceId],
            foreignColumns: [artPieces.artPieceId],
            name: "art_piece_tags_art_piece_fk",
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.tagId],
            name: "art_piece_tags_tag_fk",
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
    ]
)

// Site Settings Table
export const siteSettings = pgTable(
    "site_settings",
    {
        siteSettingsId: uuid("site_settings_id").primaryKey().defaultRandom(),
        theme: jsonb("theme").$type<SiteTheme>(),
        layoutBentoBox: jsonb("layout_bento_box"), // Left untyped (unknown) for now since the bento layout JSON structure is not yet finalized
        layoutCategoryView: jsonb("layout_category_view"), // Left untyped (unknown) for now since the category view layout JSON structure is not yet finalized
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("site_settings_singleton_uq").on(table.isSingleton),
        check("site_settings_singleton_val_chk", sql`${table.isSingleton} = true`),
    ]
)

// Relations

export const categoriesRelations = relations(categories, ({ many }) => ({
    artPieces: many(artPieces),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
    artPieces: many(artPieceTags),
}))

export const artPiecesRelations = relations(artPieces, ({ one, many }) => ({
    category: one(categories, {
        fields: [artPieces.categoryId],
        references: [categories.categoryId],
    }),
    media: many(media),
    tags: many(artPieceTags),
}))

export const mediaRelations = relations(media, ({ one }) => ({
    artPiece: one(artPieces, {
        fields: [media.artPieceId],
        references: [artPieces.artPieceId],
    }),
}))

export const artPieceTagsRelations = relations(artPieceTags, ({ one }) => ({
    artPiece: one(artPieces, {
        fields: [artPieceTags.artPieceId],
        references: [artPieces.artPieceId],
    }),
    tag: one(tags, {
        fields: [artPieceTags.tagId],
        references: [tags.tagId],
    }),
}))
