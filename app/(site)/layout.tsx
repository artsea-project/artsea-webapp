import type { Metadata } from "next"

import Header from "@/components/Header"
import HtmlShell from "@/components/HtmlShell"

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export default function SiteLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <HtmlShell bodyClassName="font-body antialiased min-h-screen flex flex-col justify-between">
            <Header />
            <main className="flex-grow">{children}</main>
        </HtmlShell>
    )
}
