import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

interface MissingTranslationProps {
    className?: string
}

export function MissingTranslation({ className }: MissingTranslationProps) {
    const t = useTranslations("Common")

    return (
        <p className={cn("font-body italic leading-relaxed text-muted-foreground", className)}>
            {t("missingTranslation")}
        </p>
    )
}
