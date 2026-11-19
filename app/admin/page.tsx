export default function AdminOverviewPage() {
    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex w-full flex-col gap-9">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Przegląd zawartości</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Podsumowanie dodanych elementów, zarządzanie kategoriami i tagami.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-normal text-muted-foreground">
                            Prace wyróżnione na stronie głównej.
                        </h3>
                    </section>

                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-normal text-muted-foreground">
                            Linki społecznościowe
                        </h3>
                    </section>
                </div>
            </div>
        </div>
    )
}
