"use client"

import type { MouseEvent, ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
    OVERVIEW_CARD_CLASS,
    OVERVIEW_CARD_LINK_CLASS,
} from "@/components/admin-overview/card-styles"
import { cn } from "@/lib/utils"

interface ClickableCardProps {
    href: string
    label: string
    className?: string
    children: ReactNode
}

export default function ClickableCard({ href, label, className, children }: ClickableCardProps) {
    const router = useRouter()

    function handleClick(event: MouseEvent<HTMLDivElement>) {
        if (event.target instanceof Element && event.target.closest("a")) return

        router.push(href)
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative cursor-pointer",
                OVERVIEW_CARD_CLASS,
                OVERVIEW_CARD_LINK_CLASS,
                className
            )}
        >
            <Link
                href={href}
                aria-label={label}
                className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <div className="relative flex h-full flex-col gap-4">{children}</div>
        </div>
    )
}
