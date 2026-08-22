import type { Metadata } from "next"

import HtmlShell from "@/components/HtmlShell"

export const metadata: Metadata = {
    title: "Artsea Panel",
    description: "Panel administracyjny Artsea",
}

export default function AdminRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return <HtmlShell bodyClassName="font-body antialiased">{children}</HtmlShell>
}
