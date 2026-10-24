"use client"

import { useEffect, useRef, useState } from "react"

import { usePrefersReducedMotion } from "@/components/portfolio/use-prefers-reduced-motion"

type PortfolioVideoProps = {
    mediaId: string
    title: string
}

// Plays only while on screen, so a page full of videos does not download them all at once.
export function PortfolioVideo({ mediaId, title }: PortfolioVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const reducedMotion = usePrefersReducedMotion()
    const [hasEnteredView, setHasEnteredView] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        video.muted = true
        if (reducedMotion) video.pause()

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    video.pause()
                    return
                }
                setHasEnteredView(true)
                if (!reducedMotion) video.play().catch(() => {})
            },
            { threshold: 0.25 }
        )
        observer.observe(video)
        return () => observer.disconnect()
    }, [reducedMotion])

    const src = `/media/${mediaId}`

    return (
        <video
            ref={videoRef}
            // The time fragment makes browsers render the first frame as a still image.
            src={reducedMotion ? `${src}#t=0.001` : src}
            preload={hasEnteredView ? "metadata" : "none"}
            muted
            loop
            playsInline
            aria-label={title}
            className="h-full w-full object-contain"
        />
    )
}
