import type { Locale } from "@/i18n/routing"
import type plMessages from "@/messages/pl.json"

declare module "next-intl" {
    interface AppConfig {
        Locale: Locale
        Messages: typeof plMessages
    }
}
