import { Suspense } from "react"
import { db } from "@/db"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import { DEFAULT_ABOUT_HEADING, parseBio, parseParagraphs } from "@/lib/profile/content"
import { profileImagePath } from "@/lib/profile/image"
import { getOrderedLinks, type ProfileLink } from "@/lib/profile/queries"

interface HeroSectionProps {
    fullName: string
    heading: string
    intro: string[]
    profileImageSrc: string | null
}

function HeroSection({ fullName, heading, intro, profileImageSrc }: HeroSectionProps) {
    return (
        <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-24 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-6 flex flex-col">
                    <div className="flex flex-col mb-12">
                        <h1 className="font-primary text-[96px] leading-[1] font-normal tracking-tight text-foreground">
                            {fullName}
                        </h1>
                        <h2 className="font-primary text-[96px] leading-[1] font-normal tracking-tight text-muted-foreground italic">
                            {heading}
                        </h2>
                    </div>

                    <div className="max-w-md flex flex-col gap-4">
                        {intro.map((paragraph, idx) => (
                            <p
                                key={idx}
                                className="font-body text-lg leading-relaxed text-foreground whitespace-pre-line"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                {profileImageSrc && (
                    <div className="md:col-span-5 md:col-start-8 relative pt-12 md:pt-0">
                        <div
                            className="absolute rounded-full bg-border z-0 max-[1060px]:hidden"
                            style={{
                                width: "280px",
                                height: "280px",
                                opacity: 0.8,
                                left: "-203px",
                                bottom: "0px",
                            }}
                        />
                        <Image
                            src={profileImageSrc}
                            alt={`Portret - ${fullName}`}
                            width={469}
                            height={703}
                            unoptimized
                            priority
                            className="relative z-10 w-full aspect-[469/703] object-cover rounded-[50px] shadow-sm"
                        />
                    </div>
                )}
            </div>
        </section>
    )
}

interface DetailedBioSectionProps {
    highlight: string[]
    body: string[]
}

function DetailedBioSection({ highlight, body }: DetailedBioSectionProps) {
    if (highlight.length === 0 && body.length === 0) return null

    return (
        <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-32 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                <div className="md:col-span-5 text-foreground flex flex-col gap-6">
                    {highlight.map((paragraph, idx) => (
                        <p
                            key={idx}
                            className="font-primary text-[32px] leading-tight font-normal whitespace-pre-line"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                {body.length > 0 && (
                    <div className="md:col-span-6 md:col-start-7 text-foreground flex flex-col gap-6">
                        {body.map((paragraph, idx) => (
                            <p
                                key={idx}
                                className="font-body text-lg leading-relaxed whitespace-pre-line"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

interface ContactSectionProps {
    email?: string | null
    socialLinks: ProfileLink[]
    paragraphs: string[]
}

function ContactSection({ email, socialLinks, paragraphs }: ContactSectionProps) {
    return (
        <section id="contact" className="max-w-[1440px] mx-auto px-10 md:px-32 pt-16 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                <div className="md:col-span-5 flex flex-col gap-6">
                    <h2 className="font-primary text-[40px] md:text-[56px] leading-[1.1] font-normal text-foreground">
                        Skontaktuj się ze mną.
                    </h2>
                    {paragraphs.length > 0 && (
                        <div className="text-muted-foreground font-body text-lg leading-relaxed flex flex-col gap-1">
                            {paragraphs.map((paragraph, idx) => (
                                <p key={idx} className="whitespace-pre-line">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="md:col-span-6 md:col-start-7 flex flex-col gap-12 pt-2 md:pt-4">
                    {email && (
                        <div className="flex w-max">
                            <a
                                href={`mailto:${email}`}
                                className="font-body text-[24px] md:text-[28px] text-foreground hover:text-primary transition-colors border-b border-foreground pb-1"
                            >
                                {email}
                            </a>
                        </div>
                    )}

                    {socialLinks.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <span className="font-secondary text-[12px] tracking-widest uppercase text-primary">
                                Znajdź mnie tutaj
                            </span>
                            <div className="flex flex-wrap gap-8">
                                {socialLinks.map((link) => (
                                    <a
                                        key={link.linkId}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 font-body text-[16px] text-foreground hover:text-primary transition-colors"
                                    >
                                        {link.name}
                                        <ArrowUpRight size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

function DecorativeWave() {
    return (
        <svg
            width="821"
            height="184"
            viewBox="0 0 821 184"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[600px] lg:max-w-none h-auto"
        >
            <path
                d="M0.223732 60.3106C146.956 -13.0553 287.018 6.95362 420.41 120.337C553.803 233.721 687.195 193.703 820.588 0.284001"
                stroke="var(--border)"
                strokeWidth="1"
            />
        </svg>
    )
}

export default function AboutPage() {
    return (
        <Suspense fallback={null}>
            <AboutContent />
        </Suspense>
    )
}

async function AboutContent() {
    let profile = null
    let socialLinksDb: ProfileLink[] = []
    try {
        profile = await db.query.profiles.findFirst({
            columns: { profileImageContent: false },
        })
        socialLinksDb = await getOrderedLinks()
    } catch (error) {
        console.error("Failed to fetch data:", error)
    }

    if (!profile) {
        notFound()
    }

    const bio = parseBio(profile.bioPln)
    const contactParagraphs = parseParagraphs(profile.contactPln)

    const profileImageSrc = profile.profileImageContentHash
        ? profileImagePath(profile.profileImageContentHash)
        : null

    return (
        <div className="w-full">
            <HeroSection
                fullName={profile.fullName}
                heading={bio.heading || DEFAULT_ABOUT_HEADING.pln}
                intro={bio.intro}
                profileImageSrc={profileImageSrc}
            />

            <div className="max-w-[1440px] mx-auto px-10 md:px-32 relative z-0">
                <div className="w-full h-px bg-border" />

                <div className="absolute right-0 md:-right-16 top-[-100px] -z-10 hidden md:block">
                    <DecorativeWave />
                </div>
            </div>

            <DetailedBioSection highlight={bio.highlight} body={bio.body} />

            <div className="max-w-[1440px] mx-auto px-10 md:px-32">
                <div className="w-full h-px bg-border" />
            </div>

            <ContactSection
                email={profile.contactEmail}
                socialLinks={socialLinksDb}
                paragraphs={contactParagraphs}
            />
        </div>
    )
}
