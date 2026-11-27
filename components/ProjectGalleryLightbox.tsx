"use client"

import Lightbox from "yet-another-react-lightbox"
import type { LightboxExternalProps, PluginProps } from "yet-another-react-lightbox"
import Video from "yet-another-react-lightbox/plugins/video"
import "yet-another-react-lightbox/styles.css"

declare module "yet-another-react-lightbox" {
    interface SlideVideo {
        alt?: string
    }
}

function VideoAlt({ augment }: PluginProps) {
    augment(({ render: { slide: renderSlide, ...restRender }, ...restProps }) => ({
        render: {
            slide: (props) => {
                const rendered = renderSlide?.(props)
                if (props.slide.type === "video" && props.slide.alt && rendered) {
                    return (
                        <div
                            role="group"
                            aria-label={props.slide.alt}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {rendered}
                        </div>
                    )
                }
                return rendered
            },
            ...restRender,
        },
        ...restProps,
    }))
}

export default function ProjectGalleryLightbox({ plugins, ...props }: LightboxExternalProps) {
    return <Lightbox {...props} plugins={[Video, VideoAlt, ...(plugins ?? [])]} />
}
