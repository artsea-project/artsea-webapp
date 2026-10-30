"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import AdminMenuDrawer from "@/components/AdminMenuDrawer"
import { getAdminPageTitle } from "@/lib/admin-routes"

interface AdminPageHeaderProps {
    menu: ReactNode
}

export default function AdminPageHeader({ menu }: AdminPageHeaderProps) {
    const title = getAdminPageTitle(usePathname())

    if (!title) {
        return null
    }

    return (
        <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center gap-3 border-b border-border bg-background px-4 font-secondary sm:px-8 md:px-16">
            <AdminMenuDrawer>{menu}</AdminMenuDrawer>
            <h1 className="text-xl font-normal text-muted-foreground">{title}</h1>
        </header>
    )
}
