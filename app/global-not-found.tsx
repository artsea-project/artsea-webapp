import type { Metadata } from "next"
import Link from "next/link"

import HtmlShell from "@/components/HtmlShell"

export const metadata: Metadata = {
    title: "404 - Nie znaleziono strony",
}

export default function GlobalNotFound() {
    return (
        <HtmlShell lang="pl">
            <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
                <h1 className="font-primary text-4xl text-foreground">Nie znaleziono strony</h1>
                <Link href="/" className="text-muted-foreground underline hover:text-foreground">
                    Wróć na stronę główną
                </Link>
            </main>
        </HtmlShell>
    )
}
