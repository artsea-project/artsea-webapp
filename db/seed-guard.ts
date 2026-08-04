export const seedArtist = {
  userId: 'a7f3bc01-0000-4000-8000-000000000001',
  username: 'artsea-artist',
  email: 'artist@artsea.local',
} as const;

type ExistingUser = {
  userId: string;
  username: string;
  email: string;
};

export function assertSeedCompatible(existingUsers: ExistingUser[]) {
  if (existingUsers.some((user) =>
    user.userId !== seedArtist.userId
    || user.username !== seedArtist.username
    || user.email !== seedArtist.email
  )) {
    throw new Error('Refusing to seed an incompatible non-empty database. Use an empty local development database.');
  }
}
