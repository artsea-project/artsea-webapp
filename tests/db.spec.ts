import { test, expect } from '@playwright/test';
import { db } from '../db';
import { users, profiles, categories, artPieces } from '../db/schema';
import { eq } from 'drizzle-orm';

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
      bioPln: { text: 'Polski opis Playwright' },
      bioEng: { text: 'English bio Playwright' },
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
      isFeatured: true,
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
    expect(queriedUser!.categories.length).toBe(1);
    expect(queriedUser!.categories[0].namePln).toBe('Malarstwo PW');
    expect(queriedUser!.categories[0].artPieces.length).toBe(1);
    expect(queriedUser!.categories[0].artPieces[0].titlePln).toBe('Dzieło Playwright');
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
