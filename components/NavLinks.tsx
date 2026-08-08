"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

interface NavLinksProps {
    bodyFont: string
}

const NAV_ITEMS = [
    { name: "O MNIE", href: "/about" },
    { name: "PORTFOLIO", href: "/" },
    { name: "KONTAKT", href: "/contact" },
]

const LANGUAGES = ["PL", "EN"] as const
type Language = (typeof LANGUAGES)[number]

function NavItemLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
    const pathname = usePathname()

    const isLinkActive = (href: string) => {
        if (href === "/") {
            return pathname === "/" || pathname === ""
        }
        return pathname === href || pathname.startsWith(`${href}/`)
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
                        className={`transition-colors duration-200 ${active ? "text-stone-800" : "text-stone-400"} ${className ?? ""}`}
                    >
                        {item.name}
                    </Link>
                )
            })}
        </>
    )
}

function LangToggle({
    currentLang,
    onSelect,
}: {
    currentLang: Language
    onSelect: (lang: Language) => void
}) {
    return (
        <>
            {LANGUAGES.map((lang, index) => (
                <Fragment key={lang}>
                    {index > 0 && <span className="text-stone-400 opacity-40">/</span>}
                    <button
                        type="button"
                        onClick={() => onSelect(lang)}
                        className={`transition-colors duration-200 focus:outline-none ${currentLang === lang ? "text-stone-800" : "text-stone-400"
                            }`}
                        aria-label={`Switch language to ${lang === "PL" ? "Polish" : "English"}`}
                    >
                        {lang}
                    </button>
                </Fragment>
            ))}
        </>
    )
}

export default function NavLinks({ bodyFont }: NavLinksProps) {
    const [currentLang, setCurrentLang] = useState<Language>("PL")
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <>
            <nav
                id="menu"
                className={`${mobileMenuOpen ? "flex" : "hidden md:flex"} absolute top-full left-0 z-50 w-full flex-col gap-4 border-b border-stone-200 bg-white/95 px-6 py-6 text-xs font-normal uppercase tracking-widest shadow-lg backdrop-blur-md md:static md:z-auto md:w-auto md:flex-row md:items-center md:gap-12 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none lg:gap-16`}
                style={{ fontFamily: bodyFont }}
            >
                <div className="contents md:flex md:items-center md:gap-12 lg:gap-16">
                    <NavItemLinks
                        className="py-2 md:py-0 md:hover:opacity-80"
                        onNavigate={() => setMobileMenuOpen(false)}
                    />
                </div>

                <div className="flex items-center gap-2 border-t border-stone-100 pt-4 text-xs font-normal md:ml-16 md:gap-1.5 md:border-0 md:pt-0 lg:ml-28">
                    <LangToggle
                        currentLang={currentLang}
                        onSelect={(lang) => {
                            setCurrentLang(lang)
                            setMobileMenuOpen(false)
                        }}
                    />
                </div>
            </nav>

            <div className="flex items-center gap-4 md:hidden">
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-stone-800 transition-colors focus:outline-none"
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </>
    )
}
