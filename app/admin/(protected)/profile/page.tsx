import { Suspense } from "react"

import LinksSection from "@/components/admin-profile/LinksSection"
import ProfileForm from "@/components/admin-profile/ProfileForm"
import AdminPageIntro from "@/components/AdminPageIntro"
import { Separator } from "@/components/ui/separator"
import { requireArtistSession } from "@/lib/auth/session"
import { getEditableProfile, getOrderedLinks } from "@/lib/profile/queries"

export const instant = false

export default function AdminProfilePage() {
    return (
        <Suspense fallback={null}>
            <ProfileContent />
        </Suspense>
    )
}

async function ProfileContent() {
    await requireArtistSession()

    const [profile, links] = await Promise.all([getEditableProfile(), getOrderedLinks()])

    return (
        <div data-leave-guard-root className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex max-w-196 flex-col gap-8">
                <AdminPageIntro
                    title="Profil artysty"
                    description="Zaktualizuj swoje dane, teksty strony O mnie w dwóch językach oraz linki społecznościowe."
                />

                <ProfileForm saved={profile} />
                <Separator className="bg-muted" />
                <LinksSection links={links} />
            </div>
        </div>
    )
}
