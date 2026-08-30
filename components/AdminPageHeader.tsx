"use client"

import { usePathname } from "next/navigation"

import { getAdminPageTitle } from "@/lib/admin-routes"

export default function AdminPageHeader() {
    const title = getAdminPageTitle(usePathname())

    if (!title) {
        return null
    }

    return (
        <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b border-slate-200 bg-white px-16 font-secondary">
            <h1 className="text-xl font-normal text-slate-500">{title}</h1>
        </header>
    )
}
