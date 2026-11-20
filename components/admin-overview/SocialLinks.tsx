import ClickableCard from "@/components/admin-overview/ClickableCard"
import OverviewEmptyState from "@/components/admin-overview/OverviewEmptyState"
import { Separator } from "@/components/ui/separator"
import type { ProfileLink } from "@/lib/profile/queries"
import { displayLinkUrl } from "@/lib/profile/validation"

interface SocialLinksProps {
    links: ProfileLink[]
}

const FILL_PANEL_CLASS = "lg:absolute lg:inset-0"

export default function SocialLinks({ links }: SocialLinksProps) {
    return (
        <div className="lg:relative lg:min-h-64 lg:flex-1">
            {links.length === 0 ? (
                <OverviewEmptyState
                    message="Nie dodano jeszcze linków."
                    actionLabel="Dodaj linki w profilu"
                    href="/admin/profile"
                    className={FILL_PANEL_CLASS}
                />
            ) : (
                <ClickableCard
                    href="/admin/profile"
                    label="Linki społecznościowe. Przejdź do Profil"
                    className={FILL_PANEL_CLASS}
                >
                    <span className="text-4xl font-bold text-foreground">{links.length}</span>
                    <Separator />
                    <ul className="-m-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-1">
                        {links.map((link) => (
                            <li key={link.linkId} className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-foreground">
                                    {link.name}
                                </span>
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
                </ClickableCard>
            )}
        </div>
    )
}
