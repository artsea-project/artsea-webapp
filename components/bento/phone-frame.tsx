import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

export const PHONE_MAX_WIDTH = 367

export const PHONE_WIDTH_TO_HEIGHT = PHONE_MAX_WIDTH / 592

type PhoneFrameProps = {
    className?: string
    style?: CSSProperties
    children: ReactNode
}

export function PhoneFrame({ className, style, children }: PhoneFrameProps) {
    return (
        <div
            className={cn(
                "mx-auto max-w-full rounded-[2rem] border-4 border-foreground p-3",
                className
            )}
            style={style}
        >
            <div
                data-bento-scroll
                className="h-full [scrollbar-gutter:stable] overflow-y-auto overscroll-contain rounded-[1.25rem] p-1"
            >
                {children}
            </div>
        </div>
    )
}
