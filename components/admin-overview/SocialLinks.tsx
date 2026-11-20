import { OVERVIEW_CARD_CLASS } from "@/components/admin-overview/card-styles"
import { Separator } from "@/components/ui/separator"
import type { ProfileLink } from "@/lib/profile/queries"
import { displayLinkUrl } from "@/lib/profile/validation"
import { cn } from "@/lib/utils"

interface SocialLinksProps {
    links: ProfileLink[]
}

export default function SocialLinks({ links }: SocialLinksProps) {
    return (
        <div className={cn("flex flex-col gap-4", OVERVIEW_CARD_CLASS)}>
            <span className="text-4xl font-bold text-foreground">{links.length}</span>
            <Separator />
            <ul className="flex flex-col gap-3">
                {links.map((link) => (
                    <li key={link.linkId} className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{link.name}</span>
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="self-start break-all text-xs text-muted-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            {displayLinkUrl(link.url)}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
