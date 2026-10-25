import { Suspense } from "react"

import ProfileForm from "@/components/admin-profile/ProfileForm"
import { getEditableProfile } from "@/lib/profile/queries"

export default function AdminProfilePage() {
    return (
        <Suspense fallback={null}>
            <ProfileContent />
        </Suspense>
    )
}

async function ProfileContent() {
    const profile = await getEditableProfile()

    return (
        <div data-leave-guard-root className="px-16 py-9 font-secondary">
            <div className="flex max-w-196 flex-col gap-8">
                <header>
                    <h2 className="text-2xl font-bold text-foreground">Profil Artysty</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Zaktualizuj swoje dane osobowe, biogram w dwóch językach oraz linki
                        społecznościowe.
                    </p>
                </header>

                <ProfileForm saved={profile} />
            </div>
        </div>
    )
}
