import { useTranslations } from "next-intl"

export function NoMatchingArtworks() {
    const t = useTranslations("Portfolio")

    return <p className="mt-10 font-body text-muted-foreground lg:mt-14">{t("noMatches")}</p>
}
