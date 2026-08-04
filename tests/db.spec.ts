import { test, expect } from '@playwright/test';
import { db } from '../db';
import { createHash } from 'node:crypto';
import { users, profiles, categories, artPieces, media, siteSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SiteTheme } from '../types/theme';
import { BioContent, ContactContent } from '../types/profile';
import type { BentoBoxLayout } from '../types/bento';
import { assertSeedCompatible, seedArtist } from '../db/seed-guard';

test.describe('Database Config & Relations Integration Test', () => {
  let createdUserId: string;
  let createdProfileId: string;
  let createdCategoryId: string;
  let createdArtPieceId: string;

  const testUsername = `playwright_artist_${Date.now()}`;
  const testEmail = `playwright_${Date.now()}@eliseroux.com`;

  // This block runs automatically once before any test executes (even if you play them individually)
  test.beforeAll(async () => {
    // 1. Insert User
    const [user] = await db.insert(users).values({
      username: testUsername,
      email: testEmail,
      passwordHash: 'playwrightpass123',
    }).returning();
    createdUserId = user.userId;

    // 2. Insert Profile
    const [profile] = await db.insert(profiles).values({
      userId: user.userId,
      fullName: 'Playwright Artist Test',
      bioPln: { paragraphs: ['Polski opis Playwright'] },
      bioEng: { paragraphs: ['English bio Playwright'] },
      contactPln: { paragraphs: ['Kontakt Playwright'] },
      contactEng: { paragraphs: ['Contact Playwright'] },
    }).returning();
    createdProfileId = profile.profileId;

    // 3. Insert Category
    const [category] = await db.insert(categories).values({
      userId: user.userId,
      namePln: 'Malarstwo PW',
      nameEng: 'Painting PW',
    }).returning();
    createdCategoryId = category.categoryId;

    // 4. Insert Art Piece
    const [artPiece] = await db.insert(artPieces).values({
      userId: user.userId,
      categoryId: category.categoryId,
      titlePln: 'Dzieło Playwright',
      titleEng: 'Playwright Artwork',
      isVisible: true,
      yearOfExecution: 2026,
    }).returning();
    createdArtPieceId = artPiece.artPieceId;
  });

  test.afterAll(async () => {
    // Clean up if not deleted in the test
    if (createdUserId) {
      await db.delete(users).where(eq(users.userId, createdUserId)).catch(() => {});
    }
  });

  test('should verify database write and linkage success', async () => {
    expect(createdUserId).toBeDefined();
    expect(createdProfileId).toBeDefined();
    expect(createdCategoryId).toBeDefined();
    expect(createdArtPieceId).toBeDefined();
  });

  test('should reject deterministic seed users with mismatched identity fields', () => {
    expect(() => assertSeedCompatible([{ ...seedArtist, username: 'unexpected-artist' }])).toThrow(
      'Refusing to seed an incompatible non-empty database.'
    );
    expect(() => assertSeedCompatible([{ ...seedArtist, email: 'unexpected@artsea.local' }])).toThrow(
      'Refusing to seed an incompatible non-empty database.'
    );
    expect(() => assertSeedCompatible([seedArtist])).not.toThrow();
  });

  test('should retrieve related records through relational query API', async () => {
    const queriedUser = await db.query.users.findFirst({
      where: eq(users.userId, createdUserId),
      with: {
        profile: true,
        categories: {
          with: {
            artPieces: true,
          },
        },
      },
    });

    expect(queriedUser).toBeDefined();
    expect(queriedUser!.username).toBe(testUsername);
    expect(queriedUser!.profile?.fullName).toBe('Playwright Artist Test');
    expect((queriedUser!.profile?.bioPln as BioContent).paragraphs[0]).toBe('Polski opis Playwright');
    expect((queriedUser!.profile?.contactPln as ContactContent).paragraphs[0]).toBe('Kontakt Playwright');
    expect(queriedUser!.categories.length).toBe(1);
    expect(queriedUser!.categories[0].namePln).toBe('Malarstwo PW');
    expect(queriedUser!.categories[0].artPieces.length).toBe(1);
    expect(queriedUser!.categories[0].artPieces[0].titlePln).toBe('Dzieło Playwright');
  });

  test('should successfully save and retrieve site theme JSON settings', async () => {
    const mockTheme: SiteTheme = {
      fonts: {
        primaryFont: 'Playfair Display',
        secondaryFont: 'Inter',
        additionalFont: 'Inter',
      },
      colors: {
        primaryColor: '#292524',
        secondaryColor: '#A8A29E',
        additionalColor: '#1C1917',
        accentColor: '#A8A29E',
        backgroundColor: '#FFFFFF',
      },
      presetTheme: 'domyslny',
      darkModeExperimental: false,
    };

    // 1. Insert Site Settings with the theme JSON
    const [settings] = await db.insert(siteSettings).values({
      userId: createdUserId,
      theme: mockTheme,
    }).returning();

    // 2. Query it back
    const retrieved = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.siteSettingsId, settings.siteSettingsId),
    });

    // 3. Verify properties
    expect(retrieved).toBeDefined();
    const theme = retrieved!.theme as SiteTheme;
    expect(theme.presetTheme).toBe('domyslny');
    expect(theme.colors.backgroundColor).toBe('#FFFFFF');
    expect(theme.fonts.primaryFont).toBe('Playfair Display');
  });

  test('should store and retrieve exact binary media content and its SHA-256 hash', async () => {
    const content = Buffer.from([0x00, 0xff, 0x10, 0x80, 0x42]);
    const contentHash = createHash('sha256').update(content).digest('hex');

    const [storedMedia] = await db.insert(media).values({
      artPieceId: createdArtPieceId,
      content,
      contentHash,
      fileType: 'png',
      orderIndex: 0,
    }).returning();

    const [retrieved] = await db.select().from(media).where(eq(media.mediaId, storedMedia.mediaId));

    expect(Buffer.isBuffer(retrieved.content)).toBe(true);
    expect(retrieved.content.equals(content)).toBe(true);
    expect(retrieved.contentHash).toBe(contentHash);
  });

  test('should reject a media content hash that is not 64 lowercase hexadecimal characters', async () => {
    await expect(db.insert(media).values({
      artPieceId: createdArtPieceId,
      content: Buffer.from([0x01]),
      contentHash: 'NOT-A-SHA-256-HASH',
      fileType: 'png',
      orderIndex: 1,
    })).rejects.toThrow();
  });

  test('should successfully save and retrieve typed bento layout settings', async () => {
    const layout: BentoBoxLayout = {
      desktop: {
        items: [{
          artPieceId: createdArtPieceId,
          mediaId: '00000000-0000-0000-0000-000000000001',
          columnStart: 1,
          rowStart: 1,
          columnSpan: 4,
          rowSpan: 10,
        }],
      },
      mobile: {
        items: [{
          artPieceId: createdArtPieceId,
          mediaId: '00000000-0000-0000-0000-000000000001',
          columnStart: 1,
          rowStart: 1,
          columnSpan: 2,
          rowSpan: 8,
        }],
      },
    };

    await db.update(siteSettings).set({ layoutBentoBox: layout }).where(eq(siteSettings.userId, createdUserId));

    const retrieved = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.userId, createdUserId),
    });

    expect(retrieved?.layoutBentoBox).toEqual(layout);
  });

  test('should successfully save and retrieve multi-paragraph bio and contact info', async () => {
    // 1. Update the profile with 3 paragraphs of bio and contact info
    await db.update(profiles).set({
      bioPln: {
        paragraphs: [
          "Paragraph PL 1",
          "Paragraph PL 2",
          "Paragraph PL 3"
        ]
      },
      bioEng: {
        paragraphs: [
          "Paragraph EN 1",
          "Paragraph EN 2",
          "Paragraph EN 3"
        ]
      },
      contactPln: {
        paragraphs: [
          "Contact PL 1",
          "Contact PL 2"
        ]
      },
      contactEng: {
        paragraphs: [
          "Contact EN 1",
          "Contact EN 2"
        ]
      }
    }).where(eq(profiles.profileId, createdProfileId));

    // 2. Query it back
    const retrieved = await db.query.profiles.findFirst({
      where: eq(profiles.profileId, createdProfileId),
    });

    // 3. Verify
    expect(retrieved).toBeDefined();
    
    const bioPln = retrieved!.bioPln as { paragraphs: string[] };
    const bioEng = retrieved!.bioEng as { paragraphs: string[] };
    const contactPln = retrieved!.contactPln as { paragraphs: string[] };
    const contactEng = retrieved!.contactEng as { paragraphs: string[] };

    expect(bioPln.paragraphs.length).toBe(3);
    expect(bioPln.paragraphs[0]).toBe("Paragraph PL 1");
    expect(bioPln.paragraphs[1]).toBe("Paragraph PL 2");
    expect(bioPln.paragraphs[2]).toBe("Paragraph PL 3");

    expect(bioEng.paragraphs.length).toBe(3);
    expect(bioEng.paragraphs[0]).toBe("Paragraph EN 1");

    expect(contactPln.paragraphs.length).toBe(2);
    expect(contactPln.paragraphs[0]).toBe("Contact PL 1");
    expect(contactPln.paragraphs[1]).toBe("Contact PL 2");

    expect(contactEng.paragraphs.length).toBe(2);
    expect(contactEng.paragraphs[0]).toBe("Contact EN 1");
  });

  test('should verify cascading delete integrity on user removal', async () => {
    // Delete the user
    await db.delete(users).where(eq(users.userId, createdUserId));

    // Profile should be deleted automatically
    const profileCheck = await db.select().from(profiles).where(eq(profiles.profileId, createdProfileId));
    expect(profileCheck.length).toBe(0);

    // Category should be deleted automatically
    const categoryCheck = await db.select().from(categories).where(eq(categories.categoryId, createdCategoryId));
    expect(categoryCheck.length).toBe(0);

    // Art piece should be deleted automatically
    const artPieceCheck = await db.select().from(artPieces).where(eq(artPieces.artPieceId, createdArtPieceId));
    expect(artPieceCheck.length).toBe(0);

    // Reset reference to prevent cleanup error in afterAll
    createdUserId = '';
  });
});
