"use client"

import { useState, type ChangeEvent, type RefObject } from "react"
import { Camera } from "lucide-react"

import ProfileAvatar from "@/components/admin-profile/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { checkProfileImageFile } from "@/lib/profile/validation"

interface ProfilePhotoFieldProps {
    previewSrc: string | null
    alt: string
    inputRef: RefObject<HTMLInputElement | null>
    serverError?: string
    onPick: (file: File) => void
}

export default function ProfilePhotoField({
    previewSrc,
    alt,
    inputRef,
    serverError,
    onPick,
}: ProfilePhotoFieldProps) {
    const [pickError, setPickError] = useState<string | null>(null)

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        const error = checkProfileImageFile(file)
        setPickError(error)

        if (error) event.target.value = ""
        else onPick(file)
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
                <FieldError>{pickError ?? serverError}</FieldError>
            </div>
        </div>
    )
}
