import { db } from "@/db"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

export default async function AboutPage() {
    let profile = null
    try {
        profile = await db.query.profiles.findFirst()
    } catch (error) {
        console.error("Failed to fetch profile:", error)
    }

    if (!profile) {
        notFound()
    }

    const bioParagraphs = profile.bioPln?.paragraphs || []
    const shortIntro =
        bioParagraphs.length > 0
            ? bioParagraphs[0]
            : "Tworzę ilustracje i identyfikacje wizualne, łącząc organiczne formy z minimalistyczną precyzją. Działam w Gdańsku, inspirując się naturą i surową architekturą."

    const socialLinks = ["Instagram", "Behance", "LinkedIn"]

    const profileImageSrc =
        profile.profileImageContent && profile.profileImageFileType
            ? `data:image/${profile.profileImageFileType};base64,${profile.profileImageContent.toString("base64")}`
            : null

    return (
        <div className="w-full">
            {/* 1. Hero Section (O mnie - krótko) */}
            <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-24 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Left: Giant Titles & Intro */}
                    <div className="md:col-span-6 flex flex-col">
                        <div className="flex flex-col mb-12">
                            <h1 className="font-primary text-[96px] leading-[1] font-normal tracking-tight text-[#292524]">
                                {profile.fullName}
                            </h1>
                            <h2 className="font-primary text-[96px] leading-[1] font-normal tracking-tight text-[#78716C] italic">
                                O mnie
                            </h2>
                        </div>

                        <div className="max-w-md">
                            <p className="font-body text-lg leading-relaxed text-[#57534E]">
                                {shortIntro}
                            </p>
                        </div>
                    </div>

                    {/* Right: Portrait Image & Accent Circle */}
                    <div className="md:col-span-5 md:col-start-8 relative pt-12 md:pt-0">
                        {/* Accent Circle */}
                        <div
                            className="absolute rounded-full z-0 max-[1060px]:hidden"
                            style={{
                                width: "280px",
                                height: "280px",
                                backgroundColor: "#DCD7CF",
                                opacity: 0.8,
                                left: "-203px",
                                bottom: "0px",
                            }}
                        />

                        {/* Image Placeholder / Rendered Image */}
                        {profileImageSrc ? (
                            <img
                                src={profileImageSrc}
                                alt={`Portret - ${profile.fullName}`}
                                className="relative z-10 w-full aspect-[469/703] object-cover rounded-[50px] shadow-sm"
                            />
                        ) : (
                            <div className="relative z-10 w-full aspect-[469/703] bg-[#E5E5E5] flex items-center justify-center rounded-[50px]">
                                <span className="font-secondary text-xs tracking-widest uppercase text-[#A8A29E]">
                                    Miejsce na zdjęcie (469x703)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Accent Line & Curvy Deco */}
            <div className="max-w-[1440px] mx-auto px-10 md:px-32 relative z-0">
                <div className="w-full h-px" style={{ backgroundColor: "#DCD7CF" }} />

                {/* Curvy SVG */}
                <div className="absolute right-0 md:-right-16 top-[-100px] -z-10 hidden md:block">
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
                            stroke="#DCD7CF"
                            strokeWidth="1"
                        />
                    </svg>
                </div>
            </div>

            {/* 2. Detailed Bio Section (O mnie - długo) */}
            <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-32 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                    {/* Left: Highlight Paragraph */}
                    {bioParagraphs.length > 1 && (
                        <div className="md:col-span-5 text-[#292524]">
                            <p className="font-primary text-[32px] leading-tight font-normal">
                                {bioParagraphs[1]}
                            </p>
                        </div>
                    )}

                    {/* Right: Remaining Paragraphs */}
                    {bioParagraphs.length > 2 && (
                        <div className="md:col-span-6 md:col-start-7 text-[#57534E] flex flex-col gap-6">
                            {bioParagraphs.slice(2).map((paragraph, idx) => (
                                <p key={idx} className="font-body text-lg leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Separator Divider */}
            <div className="max-w-[1440px] mx-auto px-10 md:px-32">
                <div className="w-full h-px" style={{ backgroundColor: "#DCD7CF" }} />
            </div>

            {/* 3. Contact Section */}
            <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-16 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                    {/* Left: Contact CTA */}
                    <div className="md:col-span-5 flex flex-col gap-6">
                        <h2 className="font-primary text-[40px] md:text-[56px] leading-[1.1] font-normal text-[#292524]">
                            Skontaktuj się ze mną.
                        </h2>
                        <div className="text-[#78716C] font-body text-lg leading-relaxed flex flex-col gap-1">
                            <p>Jeśli podoba Ci się moje podejście do designu, napisz do mnie.</p>
                            <p>Zawsze jestem otwarta na nowe, interesujące wyzwania.</p>
                        </div>
                    </div>

                    {/* Right: Email & Socials */}
                    <div className="md:col-span-6 md:col-start-7 flex flex-col gap-12 pt-2 md:pt-4">
                        <div className="flex w-max">
                            <a
                                href="mailto:elise.roux@art.pl"
                                className="font-body text-[24px] md:text-[28px] text-[#292524] hover:text-[#57534E] transition-colors border-b border-[#292524] pb-1"
                            >
                                elise.roux@art.pl
                            </a>
                        </div>

                        <div className="flex flex-col gap-4">
                            <span className="font-secondary text-[12px] tracking-widest uppercase text-[#A8A29E]">
                                Znajdź mnie tutaj
                            </span>
                            <div className="flex flex-wrap gap-8">
                                {socialLinks.map((network) => (
                                    <a
                                        key={network}
                                        href="#"
                                        className="flex items-center gap-1 font-body text-[16px] text-[#292524] hover:text-[#57534E] transition-colors"
                                    >
                                        {network}
                                        <ArrowUpRight size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
