import AdminShell from "@/components/AdminShell"
import { requireArtistSession } from "@/lib/auth/session"

export const instant = false

export default async function ProtectedAdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    await requireArtistSession()

    return <AdminShell>{children}</AdminShell>
}
