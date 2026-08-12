import { db } from "@/db"
import { SiteTheme } from "@/types/theme"

export const dynamic = "force-dynamic"

interface ContactSectionProps {
    email: string
    headingFont: string
}

function ContactSection({ email, headingFont }: ContactSectionProps) {
    return (
        <div className="flex flex-col justify-between space-y-6 md:space-y-12">
            <h2
                className="max-w-xl text-4xl font-normal leading-tight tracking-tight text-[#f4f1ec] md:text-5xl lg:text-6xl"
                style={{ fontFamily: headingFont }}
            >
                Porozmawiajmy o sztuce.
            </h2>
            <div>
                <a
                    href={`mailto:${email}`}
                    className="inline-block border-b border-[#a8a29e] pb-1 text-lg text-[#a8a29e] transition-all hover:brightness-125 md:text-xl"
                >
                    {email}
                </a>
            </div>
        </div>
    )
}

interface SocialLink {
    id: string
    name: string
    url: string
}

interface SocialsSectionProps {
    socialLinks: SocialLink[]
}

function SocialsSection({ socialLinks }: SocialsSectionProps) {
    return (
        <div className="flex flex-col justify-between items-start md:items-end text-left md:text-right space-y-12 md:space-y-0">
            <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-widest text-[#f4f1ec] transition-all hover:brightness-125 md:gap-8">
                {socialLinks.map((link) => (
                    <a
                        key={link.id}
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
    const user = await db.query.users.findFirst()
    const linksList = await db.query.links.findMany()

    const settings = await db.query.siteSettings.findFirst()
    const theme = settings?.theme as SiteTheme | undefined

    const email = user?.email || "Élise.Roux@art.pl"

    const dbSocialLinks = linksList.filter((l) => l.name.toLowerCase() !== "email")

    const socialLinks =
        dbSocialLinks.length > 0
            ? dbSocialLinks.map((l) => ({ name: l.name, url: l.url, id: l.linkId }))
            : [
                  {
                      name: "Instagram",
                      url: "https://instagram.com/elise_roux",
                      id: "default-ig",
                  },
                  {
                      name: "Behance",
                      url: "https://behance.net/elise_roux",
                      id: "default-bh",
                  },
                  { name: "LinkedIn", url: "#", id: "default-li" },
              ]

    const headingFont = theme?.fonts.primaryFont || "Playfair Display"
    const bodyFont = theme?.fonts.secondaryFont || theme?.fonts.additionalFont || "Inter"

    return (
        <footer
            className="font-sans border-t border-stone-800 bg-[#1c1917] px-6 py-16 text-[#f4f1ec] transition-colors duration-300 md:px-16 md:py-24"
            style={{ fontFamily: bodyFont }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-12 items-start justify-between md:flex-row md:items-stretch md:gap-6">
                <ContactSection email={email} headingFont={headingFont} />
                <SocialsSection socialLinks={socialLinks} />
            </div>
        </footer>
    )
}
