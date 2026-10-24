import { XIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const PILL_CLASS_NAME = "h-8 rounded-full font-secondary text-xs font-normal shadow-none"

export type TagLink = {
    tag: string
    href: string
    isSelected: boolean
}

export function TagPill({ tag, href, isSelected }: TagLink) {
    return (
        <Badge
            asChild
            variant={isSelected ? "default" : "outline"}
            className={cn(
                PILL_CLASS_NAME,
                "px-5",
                isSelected
                    ? "border-stone-800 bg-stone-800 text-[#f4f1eb] [a&]:hover:bg-stone-700"
                    : "border-stone-300 text-stone-500 [a&]:hover:bg-stone-100 [a&]:hover:text-stone-800"
            )}
        >
            <Link href={href} scroll={false} aria-current={isSelected ? "true" : undefined}>
                #{tag}
                {isSelected && <XIcon aria-hidden />}
            </Link>
        </Badge>
    )
}

export function TagPills({ links }: { links: TagLink[] }) {
    return links.map((link) => <TagPill key={link.tag} {...link} />)
}
