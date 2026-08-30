import type { Metadata } from "next"
import type { ReactNode } from "react"

import Footer from "@/components/Footer"
import Header from "@/components/Header"

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="flex min-h-screen flex-col justify-between">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    )
}
