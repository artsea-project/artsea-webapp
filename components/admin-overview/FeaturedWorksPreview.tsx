import Image from "next/image"
import Link from "next/link"

import OverviewPanel, {
    OVERVIEW_CARD_LINK_CLASSES,
} from "@/components/admin-overview/OverviewPanel"
import { bentoImageProps } from "@/components/bento/bento-card"
import { gridPlacement } from "@/lib/bento-grid"
import { cn } from "@/lib/utils"
import type { BentoLayoutItem } from "@/types/bento"

function PreviewTile({ tile }: { tile: BentoLayoutItem }) {
    return (
        <div
            className="relative overflow-hidden rounded-[10px] bg-muted"
            style={gridPlacement(tile)}
        >
            <Image {...bentoImageProps(tile.mediaId, "160px")} alt="" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-black/40" />
        </div>
    )
}

/** A miniature of the desktop home page bento; the whole card opens the layout editor. */
export default function FeaturedWorksPreview({ tiles }: { tiles: BentoLayoutItem[] }) {
    return (
        <OverviewPanel id="featured-works-heading" title="Prace wyróżnione na stronie głównej.">
            <Link
                href="/admin/appearance"
                aria-label="Edytuj układ strony głównej"
                className={cn(OVERVIEW_CARD_LINK_CLASSES, "flex-1 p-6")}
            >
                {tiles.length > 0 ? (
                    <div className="grid aspect-[4/3] grid-cols-12 grid-rows-9 gap-2">
                        {tiles.map((tile) => (
                            <PreviewTile key={tile.tileId} tile={tile} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Nie wybrano jeszcze prac na stronę główną.
                    </p>
                )}
            </Link>
        </OverviewPanel>
    )
}
