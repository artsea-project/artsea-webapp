import AdminPageIntro from "@/components/AdminPageIntro"

export default function AdminOverviewPage() {
    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex max-w-267 flex-col gap-8">
                <AdminPageIntro
                    title="Przegląd zawartości"
                    description="Podsumowanie prac, kategorii i tagów oraz tego, co widać na stronie głównej."
                />
            </div>
        </div>
    )
}
