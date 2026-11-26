import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { accounts, profiles, users } from "@/db/schema"

type RegisteredArtistAccount = {
    userId: string
    artistName: string
}

type ArtistAccountReader = Pick<typeof db, "select">

export async function findRegisteredArtistAccount(
    database: ArtistAccountReader = db
): Promise<RegisteredArtistAccount | null> {
    const userRows = await database.select({ id: users.id, name: users.name }).from(users).limit(2)
    if (userRows.length > 1) {
        throw new Error("Authentication data is inconsistent: multiple users exist.")
    }

    const user = userRows[0]
    if (!user) {
        return null
    }

    const credentialRows = await database
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
        .limit(2)
    if (credentialRows.length !== 1) {
        throw new Error(
            "Authentication data is incomplete: the existing user does not have exactly one password credential."
        )
    }

    const [profile] = await database.select({ fullName: profiles.fullName }).from(profiles).limit(1)
    return { userId: user.id, artistName: profile?.fullName ?? user.name }
}
