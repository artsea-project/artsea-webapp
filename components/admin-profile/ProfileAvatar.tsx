import { User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ProfileAvatarProps {
    src: string | null
    alt: string
    className?: string
    iconClassName?: string
}

export default function ProfileAvatar({ src, alt, className, iconClassName }: ProfileAvatarProps) {
    return (
        <Avatar className={className}>
            {src && <AvatarImage src={src} alt={alt} className="object-cover" />}
            <AvatarFallback className="bg-accent text-accent-foreground">
                <User className={cn("size-5", iconClassName)} strokeWidth={2} aria-hidden="true" />
            </AvatarFallback>
        </Avatar>
    )
}
