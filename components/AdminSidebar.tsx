"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Eye,
    Folder,
    Home,
    Image as ImageIcon,
    LayoutDashboard,
    LogOut,
    User,
    type LucideIcon,
} from "lucide-react"

import { logout } from "@/app/admin/actions"
import { cn } from "@/lib/utils"

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
    { label: "Przegląd", href: "/admin", icon: Home },
    { label: "Prace", href: "/admin/works", icon: ImageIcon },
    { label: "Kategorie", href: "/admin/categories", icon: Folder },
    { label: "Układ i Personalizacja", href: "/admin/appearance", icon: LayoutDashboard },
    { label: "Profil", href: "/admin/profile", icon: User },
]

const FOOTER_ITEMS: NavItem[] = [{ label: "Podgląd portfolio", href: "/", icon: Eye }]

// Shared so the logout button and the links can't drift apart visually.
const rowClasses = (active: boolean) =>
    cn(
        "flex h-10 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-sm transition-colors",
        active ? "bg-sky-100 text-sky-600" : "text-slate-500 hover:bg-slate-50"
    )

function SidebarLink({ label, href, icon: Icon, active }: NavItem & { active: boolean }) {
    return (
        <Link href={href} aria-current={active ? "page" : undefined} className={rowClasses(active)}>
            <Icon className="size-6 shrink-0" strokeWidth={2} aria-hidden="true" />
            {label}
        </Link>
    )
}

export default function AdminSidebar({ userName }: { userName: string }) {
    const pathname = usePathname()

    // Exact match only for index routes, so "/admin" doesn't stay active on every child page.
    const isActive = (href: string) =>
        href === "/" || href === "/admin"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)

    return (
        <aside className="flex h-full w-65 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 pt-5 pb-10 font-secondary">
            <div className="flex items-center gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaddff] text-[#4f378a]">
                    <User className="size-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="text-base font-bold text-slate-900">{userName}</span>
            </div>

            <nav aria-label="Menu główne" className="mt-6 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                    <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
                ))}
            </nav>

            <nav
                aria-label="Konto"
                className="mt-auto flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4"
            >
                {FOOTER_ITEMS.map((item) => (
                    <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
                ))}

                <form action={logout}>
                    <button type="submit" className={rowClasses(false)}>
                        <LogOut className="size-6 shrink-0" strokeWidth={2} aria-hidden="true" />
                        Wyloguj się
                    </button>
                </form>
            </nav>
        </aside>
    )
}
