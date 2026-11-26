"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type AdminAuthFormState = {
    error?: string
    fullName?: string
}

type AdminAuthCardProps = {
    mode: "login" | "first-login"
    artistName?: string
    setupToken?: string
    successMessage?: string
    action: (previousState: AdminAuthFormState, formData: FormData) => Promise<AdminAuthFormState>
}

function Field({
    id,
    label,
    type = "text",
    placeholder,
    defaultValue,
    autoComplete,
}: {
    id: string
    label: string
    type?: "text" | "password"
    placeholder?: string
    defaultValue?: string
    autoComplete?: string
}) {
    const Icon = type === "password" ? LockKeyhole : UserRound

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Icon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.75}
                />
                <Input
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    autoComplete={autoComplete}
                    required
                    className="h-11 pl-11"
                />
            </div>
        </div>
    )
}

function SubmitButton({ isFirstLogin }: { isFirstLogin: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending} className="group mt-2 h-11 w-full">
            {pending ? <>Proszę czekać&hellip;</> : isFirstLogin ? "Utwórz konto" : "Zaloguj się"}
            {!pending && (
                <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                />
            )}
        </Button>
    )
}

export default function AdminAuthCard({
    mode,
    artistName = "ArtSea Artist",
    setupToken,
    successMessage,
    action,
}: AdminAuthCardProps) {
    const isFirstLogin = mode === "first-login"
    const [state, formAction] = useActionState(action, {})

    return (
        <div className="flex min-h-svh flex-col bg-surface text-foreground">
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 h-px bg-border"
            />

            <div className="mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
                <section
                    className="w-full max-w-[440px] rounded-[10px] border border-border bg-card px-6 py-7 shadow-sm sm:px-9 sm:py-9"
                    aria-labelledby="admin-auth-title"
                >
                    <div className="mb-8">
                        {isFirstLogin && (
                            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-foreground uppercase">
                                Konfiguracja konta
                            </p>
                        )}
                        <h1
                            id="admin-auth-title"
                            className="text-2xl leading-tight font-bold tracking-[-0.02em] text-foreground"
                        >
                            {isFirstLogin ? "Pierwsze logowanie" : "Logowanie do panelu"}
                        </h1>
                        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                            {isFirstLogin
                                ? "Uzupełnij dane i ustaw hasło, którego będziesz używać do logowania."
                                : `Wprowadź hasło, aby otworzyć panel zarządzania portfolio ${artistName}.`}
                        </p>
                    </div>

                    {successMessage && (
                        <p
                            role="status"
                            className="mb-5 rounded-[10px] border border-border bg-accent px-3.5 py-3 text-sm text-accent-foreground"
                        >
                            {successMessage}
                        </p>
                    )}
                    {state.error && (
                        <p
                            role="alert"
                            className="mb-5 rounded-[10px] border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
                        >
                            {state.error}
                        </p>
                    )}

                    <form action={formAction} className="space-y-5">
                        {setupToken && (
                            <input type="hidden" name="setup-token" value={setupToken} />
                        )}
                        {isFirstLogin ? (
                            <Field
                                id="full-name"
                                label="Imię i nazwisko lub pseudonim"
                                placeholder="Wpisz imię i nazwisko lub pseudonim"
                                defaultValue={state.fullName}
                                autoComplete="name"
                            />
                        ) : (
                            <div
                                className="flex items-center gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-3"
                                role="group"
                                aria-label={`Logowanie do portfolio ${artistName}`}
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-foreground">
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-[18px]"
                                        strokeWidth={1.75}
                                    />
                                </span>
                                <span>
                                    <span className="block text-xs font-medium text-muted-foreground">
                                        Konto portfolio
                                    </span>
                                    <span className="mt-0.5 block text-sm font-semibold text-foreground">
                                        {artistName}
                                    </span>
                                </span>
                            </div>
                        )}

                        <Field
                            id="password"
                            label="Hasło"
                            type="password"
                            placeholder={isFirstLogin ? "Utwórz hasło" : "Wpisz hasło"}
                            autoComplete={isFirstLogin ? "new-password" : "current-password"}
                        />

                        {isFirstLogin && (
                            <Field
                                id="repeat-password"
                                label="Powtórz hasło"
                                type="password"
                                placeholder="Wpisz hasło ponownie"
                                autoComplete="new-password"
                            />
                        )}

                        <SubmitButton isFirstLogin={isFirstLogin} />
                    </form>

                    {isFirstLogin && (
                        <div className="mt-7 border-t border-border pt-6 text-center text-sm text-muted-foreground">
                            <span>Konto jest już skonfigurowane?</span>{" "}
                            <Link
                                href="/admin/login"
                                className="mt-1 block font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground sm:mt-0 sm:inline"
                            >
                                Przejdź do logowania
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            <footer className="px-5 pb-8 text-center text-xs text-muted-foreground">
                Artsea &middot; Prywatny panel zarządzania portfolio
            </footer>
        </div>
    )
}
