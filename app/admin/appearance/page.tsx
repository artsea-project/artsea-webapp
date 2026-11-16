import { AppearanceEditor } from "@/components/admin-appearance/AppearanceEditor"

export default function AdminAppearancePage() {
    return (
        <div data-leave-guard-root className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <AppearanceEditor />
        </div>
    )
}
