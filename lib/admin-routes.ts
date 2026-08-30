import {
    Eye,
    Folder,
    Home,
    Image as ImageIcon,
    LayoutDashboard,
    User,
    type LucideIcon,
} from "lucide-react"

export interface AdminRoute {
    label: string
    href: string
    icon: LucideIcon
}

/** Main sidebar navigation. Labels double as the page header title for each section. */
export const ADMIN_NAV_ROUTES: readonly AdminRoute[] = [
    { label: "Przegląd", href: "/admin", icon: Home },
    { label: "Prace", href: "/admin/works", icon: ImageIcon },
    { label: "Kategorie", href: "/admin/categories", icon: Folder },
    { label: "Układ i Personalizacja", href: "/admin/appearance", icon: LayoutDashboard },
    { label: "Profil", href: "/admin/profile", icon: User },
]

/** Link out of the dashboard back to the public site. */
export const PORTFOLIO_PREVIEW_ROUTE: AdminRoute = {
    label: "Podgląd portfolio",
    href: "/",
    icon: Eye,
}

/** Exact match only for index routes, so "/admin" doesn't stay active on every child page. */
export function isRouteActive(href: string, pathname: string): boolean {
    if (href === "/" || href === "/admin") {
        return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Resolves the page header title for a pathname, preferring the most specific section so
 * nested routes such as /admin/works/123 still resolve to "Prace".
 */
export function getAdminPageTitle(pathname: string): string | undefined {
    let match: AdminRoute | undefined

    for (const route of ADMIN_NAV_ROUTES) {
        const matches =
            route.href === "/admin" ? pathname === route.href : isRouteActive(route.href, pathname)

        if (matches && (!match || route.href.length > match.href.length)) {
            match = route
        }
    }

    return match?.label
}
