import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { assertSeedCompatible, seedArtist } from './seed-guard';

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local') });

async function main() {
const { db } = await import('./index');
const { artPieces, artPieceTags, categories, media, profiles, siteSettings, tags, users } = await import('./schema');

const { userId } = seedArtist;
const categoryId = 'a7f3bc01-0000-4000-8000-000000000002';
const profileId = 'a7f3bc01-0000-4000-8000-000000000003';
const siteSettingsId = 'a7f3bc01-0000-4000-8000-000000000004';
const fixtureDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

const artworks = [
  ['a7f3bc01-0000-4000-8000-000000000101', 'a7f3bc01-0000-4000-8000-000000000201', 'group-13-1.jpg', 'Campaign “Spring in the City”', 2025, 'Marble'],
  ['a7f3bc01-0000-4000-8000-000000000102', 'a7f3bc01-0000-4000-8000-000000000202', 'group-13-2.jpg', 'Spring in the City', 2026, 'Watercolor'],
  ['a7f3bc01-0000-4000-8000-000000000103', 'a7f3bc01-0000-4000-8000-000000000203', 'group-13-3.png', 'Painting', 2024, 'Watercolor'],
  ['a7f3bc01-0000-4000-8000-000000000104', 'a7f3bc01-0000-4000-8000-000000000204', 'group-13-4.jpg', 'Sculpture', 2023, 'Brass'],
  ['a7f3bc01-0000-4000-8000-000000000105', 'a7f3bc01-0000-4000-8000-000000000205', 'group-13-5.png', 'Identity Rebranding', 2024, 'Poster'],
  ['a7f3bc01-0000-4000-8000-000000000106', 'a7f3bc01-0000-4000-8000-000000000206', 'group-13-6.png', 'FinTech Application Design', 2025, 'Glass'],
  ['a7f3bc01-0000-4000-8000-000000000107', 'a7f3bc01-0000-4000-8000-000000000207', 'group-13-7.jpg', 'Organic Identity', 2026, 'Oil'],
] as const;
const tagNames = ['Marble', 'Watercolor', 'Brass', 'Poster', 'Glass', 'Oil', 'Still Life', 'Flowers', 'Classical'] as const;
const tagIdByName = Object.fromEntries(tagNames.map((name, index) => [name, `a7f3bc01-0000-4000-8000-0000000003${String(index + 1).padStart(2, '0')}`]));
const desktop = [[1, 1, 4, 10], [5, 1, 3, 5], [5, 6, 3, 5], [8, 1, 4, 10], [1, 11, 3, 7], [4, 11, 4, 7], [8, 11, 4, 7]];
const mobile = [[1, 1, 1, 8], [2, 1, 1, 5], [2, 6, 1, 3], [1, 9, 2, 8], [1, 17, 1, 6], [2, 17, 1, 6], [1, 23, 2, 8]];

const layout = {
  desktop: { items: artworks.map(([artPieceId, mediaId], index) => ({ artPieceId, mediaId, columnStart: desktop[index][0], rowStart: desktop[index][1], columnSpan: desktop[index][2], rowSpan: desktop[index][3] })) },
  mobile: { items: artworks.map(([artPieceId, mediaId], index) => ({ artPieceId, mediaId, columnStart: mobile[index][0], rowStart: mobile[index][1], columnSpan: mobile[index][2], rowSpan: mobile[index][3] })) },
};

const existingUsers = await db.select({
  userId: users.userId,
  username: users.username,
  email: users.email,
}).from(users);
assertSeedCompatible(existingUsers);

await db.transaction(async (tx) => {
  await tx.insert(users).values({ ...seedArtist, passwordHash: 'development-only-not-for-login' }).onConflictDoNothing();
  await tx.insert(profiles).values({ profileId, userId, fullName: 'ArtSea Artist' }).onConflictDoNothing();
  await tx.insert(categories).values({ categoryId, userId, namePln: 'Sztuka', nameEng: 'Art' }).onConflictDoNothing();
  await tx.insert(tags).values(tagNames.map((name) => ({ tagId: tagIdByName[name], userId, nameEng: name }))).onConflictDoNothing();

  for (const [artPieceId, mediaId, fixture, titleEng, yearOfExecution, primaryTag] of artworks) {
    await tx.insert(artPieces).values({ artPieceId, userId, categoryId, titleEng, yearOfExecution, isVisible: true }).onConflictDoNothing();
    const content = await readFile(path.join(fixtureDirectory, fixture));
    await tx.insert(media).values({ mediaId, artPieceId, content, contentHash: createHash('sha256').update(content).digest('hex'), fileType: path.extname(fixture).slice(1) as 'png' | 'jpg', orderIndex: 0 }).onConflictDoNothing();
    const artworkTags = titleEng === 'Organic Identity' ? [primaryTag, 'Still Life', 'Flowers', 'Classical'] : [primaryTag];
    await tx.insert(artPieceTags).values(artworkTags.map((name) => ({ artPieceId, tagId: tagIdByName[name] }))).onConflictDoNothing();
  }

  await tx.insert(siteSettings).values({ siteSettingsId, userId, layoutBentoBox: layout }).onConflictDoNothing();
});

console.log('Seeded or verified the deterministic Group 13 Bento portfolio data.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
