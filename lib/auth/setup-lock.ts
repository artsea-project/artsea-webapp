import { sql } from "drizzle-orm"

export const firstLoginSetupLock = sql`select pg_advisory_xact_lock(hashtext('artsea:first-login'))`
