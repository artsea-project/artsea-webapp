import { cn } from "@/lib/utils"

export type StatusNotice = { text: string; isError: boolean }

interface SectionHeaderProps {
    title: string
    description: string
    notice: StatusNotice | null
}

export default function SectionHeader({ title, description, notice }: SectionHeaderProps) {
    return (
        <div className="grid items-end gap-x-6 gap-y-2 lg:grid-cols-[11fr_14fr]">
            <div>
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>

            <p
                role="status"
                className={cn(
                    "text-sm empty:hidden lg:text-right lg:empty:block",
                    notice?.isError ? "font-medium text-destructive" : "text-muted-foreground"
                )}
            >
                {notice?.text ?? ""}
            </p>
        </div>
    )
}
