import Link from "next/link"

export default function AdminNotFound() {
    return (
        <div className="flex flex-col items-center gap-6 px-6 py-24 text-center">
            <h1 className="font-secondary text-2xl text-foreground">Nie znaleziono strony</h1>
            <Link href="/admin" className="text-muted-foreground underline hover:text-foreground">
                Wróć do panelu
            </Link>
        </div>
    )
}
