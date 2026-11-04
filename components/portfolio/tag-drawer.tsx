"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PILL_CLASS_NAME } from "@/components/portfolio/tag-pill"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { addOrRemoveTag, buildPortfolioUrl, type PortfolioQuery } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

type TagDrawerProps = {
    tags: string[]
    query: PortfolioQuery
}

type TagCheckboxListProps = {
    tags: string[]
    checkedTags: string[]
    onToggle: (tag: string) => void
}

function TagCheckboxList({ tags, checkedTags, onToggle }: TagCheckboxListProps) {
    return (
        <ul className="overflow-y-auto px-4">
            {tags.map((tag) => (
                <li key={tag} className="border-b border-border last:border-b-0">
                    <Label className="flex min-h-12 items-center gap-3 font-secondary text-sm font-normal">
                        <Checkbox
                            checked={checkedTags.includes(tag)}
                            onCheckedChange={() => onToggle(tag)}
                        />
                        #{tag}
                    </Label>
                </li>
            ))}
        </ul>
    )
}

export function TagDrawer({ tags, query }: TagDrawerProps) {
    const t = useTranslations("Portfolio")
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [checkedTags, setCheckedTags] = useState(query.tags)

    function openOrClose(open: boolean) {
        if (open) setCheckedTags(query.tags)
        setIsOpen(open)
    }

    function toggleCheckedTag(tag: string) {
        setCheckedTags((prev) => addOrRemoveTag(prev, tag))
    }

    function applyCheckedTags() {
        setIsOpen(false)
        router.push(buildPortfolioUrl({ ...query, tags: checkedTags, page: 1 }), { scroll: false })
    }

    return (
        <Drawer open={isOpen} onOpenChange={openOrClose}>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(PILL_CLASS_NAME, "border-border px-4 text-foreground")}
                >
                    <SlidersHorizontalIcon aria-hidden />
                    {t("tagsButton", { count: query.tags.length })}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle className="font-primary text-2xl font-normal">
                        {t("tags")}
                    </DrawerTitle>
                    <DrawerDescription>{t("drawerDescription")}</DrawerDescription>
                </DrawerHeader>
                <TagCheckboxList
                    tags={tags}
                    checkedTags={checkedTags}
                    onToggle={toggleCheckedTag}
                />
                <DrawerFooter>
                    <Button onClick={applyCheckedTags}>{t("applyFilters")}</Button>
                    <Button
                        variant="ghost"
                        disabled={checkedTags.length === 0}
                        onClick={() => setCheckedTags([])}
                    >
                        {t("clearFilters")}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
