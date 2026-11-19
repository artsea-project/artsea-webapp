import Link from "next/link"

import { Separator } from "@/components/ui/separator"
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
            aria-label="Przejdź do edycji linków społecznościowych"
            className="flex h-99 flex-col gap-5 rounded-xl border border-border bg-background p-7 transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <span className="text-4xl leading-none font-bold text-foreground">{links.length}</span>

            <Separator className="bg-muted" />

            {links.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Brak dodanych linków społecznościowych.
                </p>
            ) : (
                <ul className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
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
