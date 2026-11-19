import Link from "next/link"

import type { ProfileLink } from "@/lib/profile/queries"
import { displayLinkUrl } from "@/lib/profile/validation"

interface SocialLinksCardProps {
    links: ProfileLink[]
}

/** Summary card displaying the count and list of configured social links. */
export default function SocialLinksCard({ links }: SocialLinksCardProps) {
    return (
        <Link
            href="/admin/profile"
            className="flex min-h-99 flex-col gap-5 rounded-[10px] border border-border bg-background p-7 transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <span className="text-4xl leading-none font-bold text-foreground">{links.length}</span>

            <hr className="border-t-2 border-border" />

            {links.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Brak dodanych linków społecznościowych.
                </p>
            ) : (
                <ul className="flex flex-col gap-5">
                    {links.map((link) => (
                        <li key={link.linkId} className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">{link.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                                {displayLinkUrl(link.url)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Link>
    )
}
