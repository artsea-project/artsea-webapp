"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react"

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

const fieldClassName =
    "h-11 w-full rounded-[10px] border border-[#cbd5e1] bg-white px-3.5 text-sm text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/15"

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
            <label htmlFor={id} className="block text-sm font-semibold text-[#0f172a]">
                {label}
            </label>
            <div className="relative">
                <Icon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#94a3b8]"
                    strokeWidth={1.75}
                />
                <input
                    id={id}
                    name={id}
                    type={type}
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    autoComplete={autoComplete}
                    required
                    className={`${fieldClassName} pl-11`}
                />
            </div>
        </div>
    )
}

function SubmitButton({ isFirstLogin }: { isFirstLogin: boolean }) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0369a1] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#075985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] disabled:cursor-wait disabled:opacity-70"
        >
            {pending ? <>Proszę czekać&hellip;</> : isFirstLogin ? "Utwórz konto" : "Zaloguj się"}
            {!pending && (
                <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                />
            )}
        </button>
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
        <div className="flex min-h-svh flex-col bg-[#f8fafc] text-[#0f172a]">
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 h-px bg-[#e2e8f0]"
            />

            <div className="mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
                <section
                    className="w-full max-w-[440px] rounded-[10px] border border-[#e2e8f0] bg-white px-6 py-7 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:px-9 sm:py-9"
                    aria-labelledby="admin-auth-title"
                >
                    <div className="mb-8">
                        {isFirstLogin && (
                            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[#0369a1] uppercase">
                                Konfiguracja konta
                            </p>
                        )}
                        <h1
                            id="admin-auth-title"
                            className="text-2xl leading-tight font-bold tracking-[-0.02em] text-[#0f172a]"
                        >
                            {isFirstLogin ? "Pierwsze logowanie" : "Logowanie do panelu"}
                        </h1>
                        <p className="mt-2.5 text-sm leading-6 text-[#64748b]">
                            {isFirstLogin
                                ? "Uzupełnij dane i ustaw hasło, którego będziesz używać do logowania."
                                : `Wprowadź hasło, aby otworzyć panel zarządzania portfolio ${artistName}.`}
                        </p>
                    </div>

                    {successMessage && (
                        <p
                            role="status"
                            className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800"
                        >
                            {successMessage}
                        </p>
                    )}
                    {state.error && (
                        <p
                            role="alert"
                            className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
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
                                label="Imię i nazwisko"
                                placeholder="Wpisz imię i nazwisko"
                                defaultValue={state.fullName}
                                autoComplete="name"
                            />
                        ) : (
                            <div
                                className="flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-3"
                                role="group"
                                aria-label={`Logowanie do portfolio ${artistName}`}
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e0f2fe] text-[#0369a1]">
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-[18px]"
                                        strokeWidth={1.75}
                                    />
                                </span>
                                <span>
                                    <span className="block text-xs font-medium text-[#64748b]">
                                        Konto portfolio
                                    </span>
                                    <span className="mt-0.5 block text-sm font-semibold text-[#0f172a]">
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
                        <div className="mt-7 border-t border-[#e2e8f0] pt-6 text-center text-sm text-[#64748b]">
                            <span>Konto jest już skonfigurowane?</span>{" "}
                            <Link
                                href="/admin/login"
                                className="mt-1 block font-semibold text-[#0369a1] underline-offset-4 hover:underline sm:mt-0 sm:inline"
                            >
                                Przejdź do logowania
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            <footer className="px-5 pb-8 text-center text-xs text-[#64748b]">
                Artsea &middot; Prywatny panel zarządzania portfolio
            </footer>
        </div>
    )
}
