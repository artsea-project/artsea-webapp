import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import AdminAuthCard from "@/components/admin/AdminAuthCard"
import { readAuthInstallation } from "@/lib/auth/installation"
import { isSetupTokenFormat, verifySetupToken } from "@/lib/auth/setup-token"
import { registerAction } from "./actions"

export const instant = false

export const metadata: Metadata = {
    title: "Pierwsze logowanie | Artsea",
    description: "Konfiguracja konta artysty Artsea.",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
}

export default async function AdminFirstLoginPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    if (!isSetupTokenFormat(token)) {
        notFound()
    }

    const installation = await readAuthInstallation()
    if (installation?.setupCompletedAt) {
        redirect("/admin/login")
    }
    if (!installation || !(await verifySetupToken(token))) {
        notFound()
    }

    return <AdminAuthCard mode="first-login" setupToken={token} action={registerAction} />
}
