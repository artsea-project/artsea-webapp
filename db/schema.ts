import {
    pgTable,
    text,
    jsonb,
    boolean,
    integer,
    bigint,
    timestamp,
    uuid,
    primaryKey,
    foreignKey,
    unique,
    uniqueIndex,
    check,
    index,
    customType,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
    dataType() {
        return "bytea"
    },
})
import type { BioContent, ContactContent } from "@/types/profile"
import type { SiteTheme } from "@/types/theme"
import type { BentoBoxLayout } from "@/types/bento"

// User Table
export const users = pgTable(
    "users",
    {
        id: uuid("user_id").primaryKey().defaultRandom(),
        name: text("username").notNull().unique(),
        email: text("email").notNull().unique(),
        emailVerified: boolean("email_verified").notNull().default(false),
        image: text("image"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("users_singleton_uq").on(table.isSingleton),
        check("users_singleton_val_chk", sql`${table.isSingleton} = true`),
    ]
)

// Better Auth Tables
export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("accounts_user_id_idx").on(table.userId),
        unique("accounts_user_provider_uq").on(table.userId, table.providerId),
    ]
)

export const sessions = pgTable(
    "sessions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("sessions_user_id_idx").on(table.userId),
        index("sessions_expires_at_idx").on(table.expiresAt),
    ]
)

export const verifications = pgTable(
    "verifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("verifications_identifier_idx").on(table.identifier)]
)

export const rateLimits = pgTable("rate_limit", {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
})

export const authInstallation = pgTable(
    "auth_installation",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        betterAuthSecret: text("better_auth_secret").notNull(),
        setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("auth_installation_singleton_uq").on(table.isSingleton),
        check("auth_installation_singleton_val_chk", sql`${table.isSingleton} = true`),
        check(
            "auth_installation_secret_length_chk",
            sql`char_length(${table.betterAuthSecret}) >= 32`
        ),
    ]
)

// Profile Table
export const profiles = pgTable(
    "profile",
    {
        profileId: uuid("profile_id").primaryKey().defaultRandom(),
        fullName: text("full_name").notNull(),
        contactEmail: text("contact_email"),
        bioPln: jsonb("bio_pln").$type<BioContent>(),
        bioEng: jsonb("bio_eng").$type<BioContent>(),
        contactPln: jsonb("contact_pln").$type<ContactContent>(),
        contactEng: jsonb("contact_eng").$type<ContactContent>(),
        profileImageContent: bytea("profile_image_content"),
        profileImageContentHash: text("profile_image_content_hash"),
        profileImageFileType: text("profile_image_file_type", {
            enum: ["png", "jpg"],
        }),
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("profile_singleton_uq").on(table.isSingleton),
        check("profile_singleton_val_chk", sql`${table.isSingleton} = true`),
        check(
            "profile_image_content_hash_format_chk",
            sql`${table.profileImageContentHash} ~ '^[0-9a-f]{64}$'`
        ),
    ]
)

// Links Table
export const links = pgTable("links", {
    linkId: uuid("link_id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    position: integer("position").generatedAlwaysAsIdentity(),
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
        uniqueIndex("category_name_pln_uq").on(sql`lower(${table.namePln})`),
        uniqueIndex("category_name_eng_uq").on(sql`lower(${table.nameEng})`),
    ]
)

// Tag Table
export const tags = pgTable(
    "tag",
    {
        tagId: uuid("tag_id").primaryKey().defaultRandom(),
        namePln: text("name_pln").notNull(),
        nameEng: text("name_eng").notNull(),
    },
    (table) => [
        uniqueIndex("tag_name_pln_uq").on(sql`lower(${table.namePln})`),
        uniqueIndex("tag_name_eng_uq").on(sql`lower(${table.nameEng})`),
    ]
)

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
        content: bytea("content").notNull(),
        contentHash: text("content_hash").notNull(),
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
        check("media_content_hash_format_chk", sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
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
        layoutBentoBox: jsonb("layout_bento_box").$type<BentoBoxLayout>(),
        layoutCategoryView: jsonb("layout_category_view"), // Left untyped (unknown) for now since the category view layout JSON structure is not yet finalized
        isSingleton: boolean("is_singleton").notNull().default(true),
    },
    (table) => [
        unique("site_settings_singleton_uq").on(table.isSingleton),
        check("site_settings_singleton_val_chk", sql`${table.isSingleton} = true`),
    ]
)

// Relations

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}))

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
