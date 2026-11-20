import { sql } from "drizzle-orm"

// Sign-ins can run together, but password reset must wait for them to commit.
const artistPasswordLockKey = "artsea:artist-password"

export const artistSignInLock = sql`select pg_advisory_xact_lock_shared(hashtext(${artistPasswordLockKey}))`
export const artistPasswordResetLock = sql`select pg_advisory_xact_lock(hashtext(${artistPasswordLockKey}))`
