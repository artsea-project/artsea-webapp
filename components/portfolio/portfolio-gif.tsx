"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

import { usePrefersReducedMotion } from "@/components/portfolio/use-prefers-reduced-motion"

type PortfolioGifProps = {
    mediaId: string
    title: string
    width: number
    height: number
    sizes: string
}

// An animated GIF cannot be paused, so reduced motion swaps it for its first frame on a canvas.
export function PortfolioGif({ mediaId, title, width, height, sizes }: PortfolioGifProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const reducedMotion = usePrefersReducedMotion()
    const src = `/media/${mediaId}`

    useEffect(() => {
        const canvas = canvasRef.current
        if (!reducedMotion || !canvas) return

        const image = document.createElement("img")
        image.onload = () => {
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            canvas.getContext("2d")?.drawImage(image, 0, 0)
        }
        image.src = src
        return () => {
            image.onload = null
        }
    }, [reducedMotion, src])

    if (reducedMotion) {
        return (
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={title}
                width={width}
                height={height}
                className="h-full w-full object-contain"
            />
        )
    }

    return (
        <Image
            src={src}
            alt={title}
            width={width}
            height={height}
            sizes={sizes}
            unoptimized
            className="h-full w-full object-contain"
        />
    )
}
