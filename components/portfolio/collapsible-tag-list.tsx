"use client"

import { useState } from "react"

import { PILL_CLASS_NAME, TagPills, type TagLink } from "@/components/portfolio/tag-pill"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type CollapsibleTagListProps = {
    visible: TagLink[]
    hidden: TagLink[]
}

export function CollapsibleTagList({ visible, hidden }: CollapsibleTagListProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild>
            <nav aria-label="Tagi" className="flex flex-wrap gap-2.5">
                <TagPills links={visible} />
                <CollapsibleContent className="contents">
                    <TagPills links={hidden} />
                </CollapsibleContent>
                {hidden.length > 0 && (
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                PILL_CLASS_NAME,
                                "px-4 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {isExpanded ? "Mniej" : `Więcej (+${hidden.length})`}
                        </Button>
                    </CollapsibleTrigger>
                )}
            </nav>
        </Collapsible>
    )
}
