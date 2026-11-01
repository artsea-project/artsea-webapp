"use client"

import { Fragment, useState } from "react"
import { Menu, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const NAV_ITEMS = [
    { labelKey: "about", href: "/about" },
    { labelKey: "portfolio", href: "/" },
    { labelKey: "contact", href: "/about#contact" },
] as const

// Shared by the desktop bar and the mobile drawer so the two can't drift apart.
const NAV_TYPOGRAPHY = "font-secondary text-xs font-normal uppercase tracking-widest"

function NavItemLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
    const t = useTranslations("Nav")
    const pathname = usePathname()

    const isLinkActive = (href: string) => {
        const pathOnly = href.split("#")[0]
        if (pathOnly === "/") {
            return pathname === "/" || pathname === ""
        }
        return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
    }

    return (
        <>
            {NAV_ITEMS.map((item) => {
                const active = isLinkActive(item.href)

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`transition-colors duration-200 ${active ? "text-foreground" : "text-muted-foreground"} ${className ?? ""}`}
                    >
                        {t(item.labelKey)}
                    </Link>
                )
            })}
        </>
    )
}

function LangToggle({ onNavigate }: { onNavigate?: () => void }) {
    const t = useTranslations("Nav")
    const currentLocale = useLocale()
    const pathname = usePathname()

    return (
        <>
            {routing.locales.map((locale, index) => (
                <Fragment key={locale}>
                    {index > 0 && <span className="text-muted-foreground opacity-40">/</span>}
                    <Link
                        href={pathname}
                        locale={locale}
                        onClick={onNavigate}
                        className={`transition-colors duration-200 focus:outline-none ${
                            currentLocale === locale ? "text-foreground" : "text-muted-foreground"
                        }`}
                        aria-label={t("switchLanguage", { language: t(`languages.${locale}`) })}
                    >
                        {locale.toUpperCase()}
                    </Link>
                </Fragment>
            ))}
        </>
    )
}

export default function NavLinks() {
    const t = useTranslations("Nav")
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <>
            <nav className={`hidden md:flex items-center gap-12 lg:gap-16 ${NAV_TYPOGRAPHY}`}>
                <div className="flex items-center gap-12 lg:gap-16">
                    <NavItemLinks className="hover:opacity-80" />
                </div>

                <div className="flex items-center gap-1.5 ml-16 lg:ml-28 text-xs font-normal">
                    <LangToggle />
                </div>
            </nav>

            <div className="md:hidden flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-foreground transition-colors focus:outline-none"
                    aria-label={t("toggleMenu")}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Stays mounted so the toggle's aria-controls always resolves to a real element. */}
            <nav
                id="mobile-menu"
                className={`${mobileMenuOpen ? "flex" : "hidden"} md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-muted-foreground/20 py-6 px-6 flex-col gap-4 shadow-lg z-50 ${NAV_TYPOGRAPHY}`}
            >
                <NavItemLinks className="py-2" onNavigate={() => setMobileMenuOpen(false)} />

                <div className="flex items-center gap-2 pt-4 border-t border-muted-foreground/20 text-xs font-normal">
                    <LangToggle onNavigate={() => setMobileMenuOpen(false)} />
                </div>
            </nav>
        </>
    )
}
