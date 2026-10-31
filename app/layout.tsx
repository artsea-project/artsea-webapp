import type { ReactNode } from "react"
import HtmlShell from "@/components/HtmlShell"

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return <HtmlShell lang="pl">{children}</HtmlShell>
}
