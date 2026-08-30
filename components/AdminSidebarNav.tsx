"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { logout } from "@/app/admin/actions"
import {
    ADMIN_NAV_ROUTES,
    PORTFOLIO_PREVIEW_ROUTE,
    isRouteActive,
    type AdminRoute,
} from "@/lib/admin-routes"
import { cn } from "@/lib/utils"

// Shared so the logout button and the links can't drift apart visually.
const rowClasses = (active: boolean) =>
    cn(
        "flex h-10 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-sm transition-colors",
        active ? "bg-sky-100 text-sky-600" : "text-slate-500 hover:bg-slate-50"
    )

function SidebarLink({ label, href, icon: Icon, active }: AdminRoute & { active: boolean }) {
    return (
        <Link href={href} aria-current={active ? "page" : undefined} className={rowClasses(active)}>
            <Icon className="size-6 shrink-0" strokeWidth={2} aria-hidden="true" />
            {label}
        </Link>
    )
}

export default function AdminSidebarNav() {
    const pathname = usePathname()

    return (
        <>
            <nav aria-label="Menu główne" className="mt-6 flex flex-col gap-2">
                {ADMIN_NAV_ROUTES.map((route) => (
                    <SidebarLink
                        key={route.href}
                        {...route}
                        active={isRouteActive(route.href, pathname)}
                    />
                ))}
            </nav>

            <nav
                aria-label="Konto"
                className="mt-auto flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4"
            >
                <SidebarLink
                    {...PORTFOLIO_PREVIEW_ROUTE}
                    active={isRouteActive(PORTFOLIO_PREVIEW_ROUTE.href, pathname)}
                />

                <form action={logout}>
                    <button type="submit" className={rowClasses(false)}>
                        <LogOut className="size-6 shrink-0" strokeWidth={2} aria-hidden="true" />
                        Wyloguj się
                    </button>
                </form>
            </nav>
        </>
    )
}
