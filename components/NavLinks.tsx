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
                        className={`transition-colors duration-200 focus:outline-none ${
                            currentLang === lang ? "text-stone-800" : "text-stone-400"
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
                className="hidden md:flex items-center gap-12 lg:gap-16 text-xs font-normal uppercase tracking-widest"
                style={{ fontFamily: bodyFont }}
            >
                <div className="flex items-center gap-12 lg:gap-16">
                    <NavItemLinks className="hover:opacity-80" />
                </div>

                <div className="flex items-center gap-1.5 ml-16 lg:ml-28 text-xs font-normal">
                    <LangToggle currentLang={currentLang} onSelect={setCurrentLang} />
                </div>
            </nav>

            <div className="md:hidden flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-stone-800 transition-colors focus:outline-none"
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <nav
                    id="mobile-menu"
                    className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 py-6 px-6 flex flex-col gap-4 text-xs font-normal uppercase tracking-widest shadow-lg z-50"
                    style={{ fontFamily: bodyFont }}
                >
                    <NavItemLinks className="py-2" onNavigate={() => setMobileMenuOpen(false)} />

                    <div className="flex items-center gap-2 pt-4 border-t border-stone-100 text-xs font-normal">
                        <LangToggle
                            currentLang={currentLang}
                            onSelect={(lang) => {
                                setCurrentLang(lang)
                                setMobileMenuOpen(false)
                            }}
                        />
                    </div>
                </nav>
            )}
        </>
    )
}
