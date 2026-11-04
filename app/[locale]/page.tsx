import { getLocale, getTranslations } from "next-intl/server"

import { BentoBox } from "@/components/bento/bento-box"
import { getBentoData } from "@/lib/bento"

export default async function Home() {
    const t = await getTranslations("Home")
    const data = await getBentoData(await getLocale())

    return (
        <div className="bg-background py-12 text-foreground sm:py-16 lg:py-24">
            <section aria-labelledby="selected-works-heading" className="page-container">
                <h1
                    id="selected-works-heading"
                    className="mb-8 font-primary text-4xl leading-none tracking-[-0.03em] sm:mb-10 sm:text-5xl lg:text-[56px]"
                >
                    {t("heading")}
                </h1>
                <BentoBox data={data} />
            </section>
        </div>
    )
}
