import { getContactEmail, getOrderedLinks, type ProfileLink } from "@/lib/profile/queries"

interface ContactSectionProps {
    email?: string | null
}

function ContactSection({ email }: ContactSectionProps) {
    return (
        <div className="flex flex-col justify-between space-y-6 md:space-y-12">
            <h2 className="max-w-xl text-4xl font-normal leading-tight tracking-tight text-background md:text-5xl lg:text-6xl font-primary">
                Porozmawiajmy o sztuce.
            </h2>
            {email && (
                <div>
                    <a
                        href={`mailto:${email}`}
                        className="inline-block border-b border-background pb-1 text-lg text-background transition-all hover:opacity-80 md:text-xl"
                    >
                        {email}
                    </a>
                </div>
            )}
        </div>
    )
}

interface SocialsSectionProps {
    socialLinks: ProfileLink[]
}

function SocialsSection({ socialLinks }: SocialsSectionProps) {
    if (socialLinks.length === 0) return null
    return (
        <div className="flex flex-col justify-between items-start md:items-end text-left md:text-right space-y-12 md:space-y-0">
            <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-widest text-background transition-all hover:brightness-125 md:gap-8">
                {socialLinks.map((link) => (
                    <a
                        key={link.linkId}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-opacity hover:opacity-80"
                    >
                        {link.name}
                    </a>
                ))}
            </div>
        </div>
    )
}

export default async function Footer() {
    const [email, socialLinks] = await Promise.all([getContactEmail(), getOrderedLinks()])

    return (
        <footer className="font-body border-t border-primary bg-foreground px-6 py-16 text-background transition-colors duration-300 md:px-16 md:py-24">
            <div className="mx-auto flex max-w-7xl flex-col gap-12 items-start justify-between md:flex-row md:items-stretch md:gap-6">
                <ContactSection email={email} />
                <SocialsSection socialLinks={socialLinks} />
            </div>
        </footer>
    )
}
