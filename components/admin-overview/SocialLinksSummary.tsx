import { Globe, Instagram, Linkedin } from "lucide-react"

import OverviewPanel, { OVERVIEW_CARD_CLASSES } from "@/components/admin-overview/OverviewPanel"
import { Separator } from "@/components/ui/separator"
import type { ProfileLink } from "@/lib/profile/queries"
import { cn } from "@/lib/utils"

function readHost(url: string): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "")
    } catch {
        return null
    }
}

function isOnHost(host: string | null, platformHost: string): boolean {
    return host === platformHost || Boolean(host?.endsWith(`.${platformHost}`))
}

/** Known platforms get their logo, any other site a globe. */
function PlatformIcon({ url }: { url: string }) {
    const host = readHost(url)
    const props = {
        className: "size-6 shrink-0 text-muted-foreground",
        strokeWidth: 1.5,
        "aria-hidden": true,
    } as const

    if (isOnHost(host, "instagram.com")) return <Instagram {...props} />
    if (isOnHost(host, "linkedin.com")) return <Linkedin {...props} />
    return <Globe {...props} />
}

/** "https://www.instagram.com/name/" reads as "instagram.com/name". */
function displayUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
}

function SocialLink({ url }: Pick<ProfileLink, "url">) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 text-sm text-foreground hover:underline"
        >
            <PlatformIcon url={url} />
            <span className="min-w-0 truncate">{displayUrl(url)}</span>
        </a>
    )
}

export default function SocialLinksSummary({ links }: { links: ProfileLink[] }) {
    return (
        <OverviewPanel id="social-links-heading" title="Social media">
            <div className={cn(OVERVIEW_CARD_CLASSES, "flex-1 p-6")}>
                <p className="text-4xl font-bold text-foreground">{links.length}</p>
                <Separator className="my-5" />
                {links.length > 0 ? (
                    <ul className="flex flex-col gap-6">
                        {links.map((link) => (
                            <li key={link.linkId}>
                                <SocialLink url={link.url} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">Nie dodano jeszcze linków.</p>
                )}
            </div>
        </OverviewPanel>
    )
}
