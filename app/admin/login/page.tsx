import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import AdminAuthCard from "@/components/admin/AdminAuthCard"
import { getArtistSession } from "@/lib/auth/session"
import { loginAction } from "./actions"

export const instant = false

export const metadata: Metadata = {
    title: "Logowanie | Artsea",
    description: "Logowanie do panelu artysty Artsea.",
}

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ created?: string }>
}) {
    if (await getArtistSession()) {
        redirect("/admin")
    }

    const [[profile], [user], params] = await Promise.all([
        db.query.profiles.findMany({ limit: 1 }),
        db.query.users.findMany({ limit: 1 }),
        searchParams,
    ])
    const artistName = profile?.fullName ?? user?.name ?? "ArtSea Artist"

    return (
        <AdminAuthCard
            mode="login"
            artistName={artistName}
            action={loginAction}
            successMessage={
                params.created === "1"
                    ? "Konto zostało utworzone. Zaloguj się ustawionym hasłem."
                    : undefined
            }
        />
    )
}
