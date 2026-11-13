import { revalidatePath, revalidateTag } from "next/cache"

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type RevalidatePathEntry = string | { path: string; type?: "page" | "layout" }

export function readText(formData: FormData, name: string): string {
    const value = formData.get(name)
    return typeof value === "string" ? value : ""
}

export function readTextList(formData: FormData, name: string): string[] {
    return formData.getAll(name).filter((value): value is string => typeof value === "string")
}

export function failed<Field extends string>(fieldErrors: FieldErrors<Field>, formError?: string) {
    return formError
        ? { status: "error" as const, fieldErrors, formError }
        : { status: "error" as const, fieldErrors }
}

export function getPostgresErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("code" in error && typeof error.code === "string") return error.code
    if ("cause" in error) return getPostgresErrorCode(error.cause)
    return undefined
}

export function getPostgresConstraintName(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("constraint" in error && typeof error.constraint === "string") return error.constraint
    if ("cause" in error) return getPostgresConstraintName(error.cause)
    return undefined
}

export function isOutsideRequestContextError(error: unknown): boolean {
    return (
        error instanceof Error &&
        typeof error.message === "string" &&
        error.message.includes("static generation store missing")
    )
}

export function revalidateViews(options: { paths?: RevalidatePathEntry[]; tags?: string[] }) {
    try {
        for (const entry of options.paths ?? []) {
            if (typeof entry === "string") {
                revalidatePath(entry)
            } else {
                revalidatePath(entry.path, entry.type)
            }
        }
        for (const tag of options.tags ?? []) {
            revalidateTag(tag, "max")
        }
    } catch (error) {
        if (!isOutsideRequestContextError(error)) {
            console.error("Failed to revalidate cache:", error)
        }
    }
}
