interface AdminPageIntroProps {
    title: string
    description: string
}

export default function AdminPageIntro({ title, description }: AdminPageIntroProps) {
    return (
        <header>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </header>
    )
}
