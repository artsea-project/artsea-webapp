import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"

export default async function LocaleNotFound() {
    const t = await getTranslations("NotFound")

    return (
        <div className="flex flex-col items-center gap-6 px-6 py-24 text-center">
            <h1 className="font-primary text-4xl text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
            <Link href="/" className="text-muted-foreground underline hover:text-foreground">
                {t("backHome")}
            </Link>
        </div>
    )
}
