import type { Metadata } from "next"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import HtmlShell from "@/components/HtmlShell"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    return (
        <HtmlShell lang={locale}>
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
