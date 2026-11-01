"use client"

import { CloudUpload, GripVertical, Image as ImageIcon, Trash2 } from "lucide-react"
import { useRef, useState, type DragEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WorkMediaItem } from "@/lib/works/queries"
import {
    formatFileSize,
    MAX_MEDIA_FILE_BYTES,
    resolveUploadedFileType,
} from "@/lib/works/validation"

export type EditableMediaItem =
    | {
          key: string
          kind: "existing"
          mediaId: string
          fileName: string
          fileType: string
          sizeBytes: number
          previewUrl: string
      }
    | {
          key: string
          kind: "new"
          file: File
          fileName: string
          fileType: string
          sizeBytes: number
          previewUrl: string
      }

export function toInitialMediaItems(items: WorkMediaItem[]): EditableMediaItem[] {
    return items.map((item, index) => ({
        key: `existing:${item.mediaId}`,
        kind: "existing",
        mediaId: item.mediaId,
        fileName: `plik-${index + 1}.${item.fileType}`,
        fileType: item.fileType,
        sizeBytes: item.sizeBytes,
        previewUrl: `/admin/media/${item.mediaId}`,
    }))
}

interface WorkMediaManagerProps {
    items: EditableMediaItem[]
    onChange: (items: EditableMediaItem[]) => void
}

export default function WorkMediaManager({ items, onChange }: WorkMediaManagerProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [isDropActive, setIsDropActive] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    function addFiles(fileList: FileList | null) {
        if (!fileList || fileList.length === 0) return
        setUploadError(null)

        const nextItems = [...items]
        for (const file of Array.from(fileList)) {
            const fileType = resolveUploadedFileType(file.type, file.name)
            if (!fileType) {
                setUploadError("Obsługiwane formaty plików to PNG, JPG, GIF oraz MP4.")
                continue
            }
            if (file.size === 0 || file.size > MAX_MEDIA_FILE_BYTES) {
                setUploadError("Każdy plik musi mieć rozmiar od 1 B do 10 MB.")
                continue
            }

            nextItems.push({
                key: `new:${crypto.randomUUID()}`,
                kind: "new",
                file,
                fileName: file.name,
                fileType,
                sizeBytes: file.size,
                previewUrl: URL.createObjectURL(file),
            })
        }

        onChange(nextItems)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function removeItem(index: number) {
        const removed = items[index]
        if (removed?.kind === "new") {
            URL.revokeObjectURL(removed.previewUrl)
        }
        onChange(items.filter((_, itemIndex) => itemIndex !== index))
    }

    function handleRowDrop(targetIndex: number) {
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null)
            return
        }
        const reordered = [...items]
        const [moved] = reordered.splice(draggedIndex, 1)
        reordered.splice(targetIndex, 0, moved)
        setDraggedIndex(null)
        onChange(reordered)
    }

    function handleZoneDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        setIsDropActive(false)
        addFiles(event.dataTransfer.files)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Zdjęcia pracy</span>

                <div
                    onDragOver={(event) => {
                        event.preventDefault()
                        setIsDropActive(true)
                    }}
                    onDragLeave={() => setIsDropActive(false)}
                    onDrop={handleZoneDrop}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center transition-colors",
                        isDropActive ? "border-primary bg-primary/5" : "border-border"
                    )}
                >
                    <CloudUpload aria-hidden="true" className="size-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        Przeciągnij i upuść zdjęcia tutaj, lub{" "}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-semibold text-primary hover:underline"
                        >
                            przeglądaj pliki
                        </button>
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/gif,video/mp4"
                        onChange={(event) => addFiles(event.target.files)}
                        className="sr-only"
                    />
                </div>

                {uploadError && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                        {uploadError}
                    </p>
                )}
            </div>

            {items.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div>
                        <h3 className="text-sm font-medium text-foreground">
                            Kolejność wyświetlania
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Przeciągnij za uchwyt z lewej strony, aby zmienić priorytet. Pierwsze
                            zdjęcie to też okładka.
                        </p>
                    </div>

                    <ul className="flex flex-col gap-2.5">
                        {items.map((item, index) => {
                            const isCover = index === 0
                            return (
                                <li
                                    key={item.key}
                                    draggable
                                    onDragStart={() => setDraggedIndex(index)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => handleRowDrop(index)}
                                    onDragEnd={() => setDraggedIndex(null)}
                                    className={cn(
                                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                                        isCover
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-background"
                                    )}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            aria-hidden="true"
                                            className="cursor-grab text-muted-foreground active:cursor-grabbing"
                                        >
                                            <GripVertical className="size-4" />
                                        </span>

                                        <div className="relative size-11 shrink-0">
                                            <div className="flex size-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                                                {item.fileType === "mp4" ? (
                                                    <ImageIcon className="size-4 text-muted-foreground" />
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.previewUrl}
                                                        alt={item.fileName}
                                                        className="size-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "absolute -top-1.5 -left-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold shadow-xs",
                                                    isCover
                                                        ? "bg-primary text-primary-foreground"
                                                        : "border border-border bg-background text-muted-foreground"
                                                )}
                                            >
                                                {index + 1}
                                            </span>
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    "truncate text-xs text-foreground",
                                                    isCover ? "font-bold" : "font-normal"
                                                )}
                                            >
                                                {item.fileName}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {formatFileSize(item.sizeBytes)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        {isCover && (
                                            <Badge className="rounded-md bg-primary/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary uppercase hover:bg-primary/15">
                                                OKŁADKA
                                            </Badge>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Usuń plik ${item.fileName}`}
                                            onClick={() => removeItem(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}
