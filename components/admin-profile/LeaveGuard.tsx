"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const GUARD_ROOT_SELECTOR = "[data-leave-guard-root]"

type PendingLeave = { kind: "link"; href: string } | { kind: "form"; form: HTMLFormElement }

function isPlainLeftClick(event: MouseEvent) {
    return (
        event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    )
}

function readLeavingHref(event: MouseEvent): string | null {
    if (event.defaultPrevented || !isPlainLeftClick(event)) return null

    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return null

    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
        return null
    }

    return `${url.pathname}${url.search}${url.hash}`
}

export function useLeaveGuard(enabled: boolean): ReactNode {
    const router = useRouter()
    const [pending, setPending] = useState<PendingLeave | null>(null)
    const isLeaving = useRef(false)

    useEffect(() => {
        if (!enabled) return

        function stop(event: Event, leave: PendingLeave) {
            event.preventDefault()
            event.stopPropagation()
            setPending(leave)
        }

        function onClick(event: MouseEvent) {
            const href = isLeaving.current ? null : readLeavingHref(event)
            if (href) stop(event, { kind: "link", href })
        }

        function onSubmit(event: SubmitEvent) {
            const form = event.target
            if (isLeaving.current || !(form instanceof HTMLFormElement)) return
            if (!form.closest(GUARD_ROOT_SELECTOR)) stop(event, { kind: "form", form })
        }

        function onBeforeUnload(event: BeforeUnloadEvent) {
            if (!isLeaving.current) event.preventDefault()
        }

        document.addEventListener("click", onClick, true)
        document.addEventListener("submit", onSubmit, true)
        window.addEventListener("beforeunload", onBeforeUnload)

        return () => {
            document.removeEventListener("click", onClick, true)
            document.removeEventListener("submit", onSubmit, true)
            window.removeEventListener("beforeunload", onBeforeUnload)
        }
    }, [enabled])

    function leave() {
        if (!pending) return

        isLeaving.current = true
        setPending(null)

        if (pending.kind === "link") router.push(pending.href)
        else pending.form.requestSubmit()
    }

    return (
        <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
            <AlertDialogContent className="admin-theme font-secondary text-foreground">
                <AlertDialogHeader>
                    <AlertDialogTitle>Masz niezapisane zmiany</AlertDialogTitle>
                    <AlertDialogDescription>
                        Jeśli wyjdziesz, niezapisane zmiany w profilu przepadną.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Zostań</AlertDialogCancel>
                    <AlertDialogAction onClick={leave}>Wyjdź bez zapisywania</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
