"use client"

import Lightbox from "yet-another-react-lightbox"
import type { LightboxExternalProps } from "yet-another-react-lightbox"
import Video from "yet-another-react-lightbox/plugins/video"
import "yet-another-react-lightbox/styles.css"

export default function ProjectGalleryLightbox({ plugins, ...props }: LightboxExternalProps) {
    return <Lightbox {...props} plugins={[Video, ...(plugins ?? [])]} />
}
