import { pgTable, text, jsonb, boolean, integer, timestamp, uuid, primaryKey, foreignKey, unique, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { BioContent, ContactContent } from '../types/profile';
import type { SiteTheme } from '../types/theme';
import type { BentoBoxLayout } from '../types/bento';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
    dataType() {
        return 'bytea';
    },
});

// User Table
export const users = pgTable('users', {
    userId: uuid('user_id').primaryKey().defaultRandom(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Profile Table
export const profiles = pgTable(
    'profile',
    {
        profileId: uuid('profile_id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull().unique(),
        fullName: text('full_name').notNull(),
        bioPln: jsonb('bio_pln').$type<BioContent>(),
        bioEng: jsonb('bio_eng').$type<BioContent>(),
        contactPln: jsonb('contact_pln').$type<ContactContent>(),
        contactEng: jsonb('contact_eng').$type<ContactContent>(),
        profileImageUrl: text('profile_image_url'),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
            name: 'profile_user_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);


// Links Table
export const links = pgTable(
    'links',
    {
        linkId: uuid('link_id').primaryKey().defaultRandom(),
        profileId: uuid('profile_id').notNull(),
        name: text('name').notNull(),
        url: text('url').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.profileId],
            foreignColumns: [profiles.profileId],
            name: 'links_profile_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);

// Category Table
export const categories = pgTable(
    'category',
    {
        categoryId: uuid('category_id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull(),
        namePln: text('name_pln').notNull(),
        nameEng: text('name_eng').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
            name: 'category_user_fk',
        }).onDelete('cascade').onUpdate('cascade'),
        unique('category_user_name_pln_uq').on(table.userId, table.namePln),
        unique('category_user_name_eng_uq').on(table.userId, table.nameEng),
    ]
);

// Tag Table
export const tags = pgTable(
    'tag',
    {
        tagId: uuid('tag_id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull(),
        namePln: text('name_pln'),
        nameEng: text('name_eng'),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
            name: 'tag_user_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);

// Art Piece Table
export const artPieces = pgTable(
    'art_piece',
    {
        artPieceId: uuid('art_piece_id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull(),
        categoryId: uuid('category_id').notNull(),
        isVisible: boolean('is_visible').notNull().default(true),
        titlePln: text('title_pln'),
        titleEng: text('title_eng'),
        dimensions: text('dimensions'),
        yearOfExecution: integer('year_of_execution'),
        miniDescriptionPln: jsonb('mini_description_pln'),
        miniDescriptionEng: jsonb('mini_description_eng'),
        descriptionPln: jsonb('description_pln'),
        descriptionEng: jsonb('description_eng'),
        uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
            name: 'art_piece_user_fk',
        }).onDelete('cascade').onUpdate('cascade'),
        foreignKey({
            columns: [table.categoryId],
            foreignColumns: [categories.categoryId],
            name: 'art_piece_category_fk',
        }).onDelete('restrict').onUpdate('cascade'),
    ]
);

// Media Table
export const media = pgTable(
    'media',
    {
        mediaId: uuid('media_id').primaryKey().defaultRandom(),
        artPieceId: uuid('art_piece_id').notNull(),
        content: bytea('content').notNull(),
        contentHash: text('content_hash').notNull(),
        fileType: text('file_type', { enum: ['png', 'jpg', 'gif', 'mp4'] }).notNull(),
        orderIndex: integer('order_index').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.artPieceId],
            foreignColumns: [artPieces.artPieceId],
            name: 'media_art_piece_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);

// Art Piece Tags (Join Table)
export const artPieceTags = pgTable(
    'art_piece_tags',
    {
        artPieceId: uuid('art_piece_id').notNull(),
        tagId: uuid('tag_id').notNull(),
    },
    (table) => [
        primaryKey({
            columns: [table.artPieceId, table.tagId],
            name: 'art_piece_tags_pk',
        }),
        foreignKey({
            columns: [table.artPieceId],
            foreignColumns: [artPieces.artPieceId],
            name: 'art_piece_tags_art_piece_fk',
        }).onDelete('cascade').onUpdate('cascade'),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.tagId],
            name: 'art_piece_tags_tag_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);

// Site Settings Table
export const siteSettings = pgTable(
    'site_settings',
    {
        siteSettingsId: uuid('site_settings_id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull().unique(),
        theme: jsonb('theme').$type<SiteTheme>(),
        layoutBentoBox: jsonb('layout_bento_box').$type<BentoBoxLayout>(),
        layoutCategoryView: jsonb('layout_category_view'), // Left untyped (unknown) for now since the category view layout JSON structure is not yet finalized
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
            name: 'site_settings_user_fk',
        }).onDelete('cascade').onUpdate('cascade'),
    ]
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles),
    categories: many(categories),
    artPieces: many(artPieces),
    tags: many(tags),
    siteSettings: one(siteSettings),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.userId],
    }),
    links: many(links),
}));

export const linksRelations = relations(links, ({ one }) => ({
    profile: one(profiles, {
        fields: [links.profileId],
        references: [profiles.profileId],
    }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.userId],
        references: [users.userId],
    }),
    artPieces: many(artPieces),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
    user: one(users, {
        fields: [tags.userId],
        references: [users.userId],
    }),
    artPieces: many(artPieceTags),
}));

export const artPiecesRelations = relations(artPieces, ({ one, many }) => ({
    user: one(users, {
        fields: [artPieces.userId],
        references: [users.userId],
    }),
    category: one(categories, {
        fields: [artPieces.categoryId],
        references: [categories.categoryId],
    }),
    media: many(media),
    tags: many(artPieceTags),
}));

export const mediaRelations = relations(media, ({ one }) => ({
    artPiece: one(artPieces, {
        fields: [media.artPieceId],
        references: [artPieces.artPieceId],
    }),
}));

export const artPieceTagsRelations = relations(artPieceTags, ({ one }) => ({
    artPiece: one(artPieces, {
        fields: [artPieceTags.artPieceId],
        references: [artPieces.artPieceId],
    }),
    tag: one(tags, {
        fields: [artPieceTags.tagId],
        references: [tags.tagId],
    }),
}));

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
    user: one(users, {
        fields: [siteSettings.userId],
        references: [users.userId],
    }),
}));
