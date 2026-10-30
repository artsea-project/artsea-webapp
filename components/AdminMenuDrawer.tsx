"use client"

import { useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function AdminMenuDrawer({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [openOn, setOpenOn] = useState<string | null>(null)

    return (
        <Sheet
            open={openOn === pathname}
            onOpenChange={(open) => setOpenOn(open ? pathname : null)}
        >
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Otwórz menu">
                    <Menu className="size-6" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="admin-theme w-65 gap-0 px-4 pt-5 pb-10 font-secondary text-foreground"
            >
                <SheetTitle className="sr-only">Menu panelu</SheetTitle>
                {children}
            </SheetContent>
        </Sheet>
    )
}
