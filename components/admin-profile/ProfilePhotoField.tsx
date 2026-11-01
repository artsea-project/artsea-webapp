"use client"

import type { ChangeEvent, RefObject } from "react"
import { Camera } from "lucide-react"

import ProfileAvatar from "@/components/admin-profile/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { checkProfileImageFile } from "@/lib/profile/validation"

interface ProfilePhotoFieldProps {
    previewSrc: string | null
    alt: string
    inputRef: RefObject<HTMLInputElement | null>
    error?: string
    onPick: (file: File) => void
    onReject: (error: string) => void
}

export default function ProfilePhotoField({
    previewSrc,
    alt,
    inputRef,
    error,
    onPick,
    onReject,
}: ProfilePhotoFieldProps) {
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        const fileError = checkProfileImageFile(file)
        if (fileError) {
            event.target.value = ""
            onReject(fileError)
        } else {
            onPick(file)
        }
    }

    return (
        <div className="flex items-center gap-5">
            <ProfileAvatar src={previewSrc} alt={alt} className="size-20" iconClassName="size-10" />
            <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                    <Camera />
                    Zmień zdjęcie
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">JPG, PNG. Max. 2 MB.</p>
                <FieldError>{error}</FieldError>
            </div>
        </div>
    )
}
