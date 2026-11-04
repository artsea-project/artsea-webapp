import type { Metadata } from "next"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { Suspense, type ReactNode } from "react"

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import HtmlShell from "@/components/HtmlShell"
import { routing } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata")
    return { title: t("title"), description: t("description") }
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

interface PublicLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    return (
        // A stable scrollbar gutter keeps the centred header from shifting sideways when moving
        // between pages that do and do not scroll.
        <HtmlShell lang={locale} className="[scrollbar-gutter:stable]">
            <NextIntlClientProvider>
                <div className="flex min-h-screen flex-col justify-between">
                    <Suspense fallback={null}>
                        <Header />
                    </Suspense>
                    <main className="flex-grow">{children}</main>
                    <Suspense fallback={null}>
                        <Footer />
                    </Suspense>
                </div>
            </NextIntlClientProvider>
        </HtmlShell>
    )
}
