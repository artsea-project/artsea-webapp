import { db } from "@/db"
import { notFound } from "next/navigation"

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

                        {/* Image Placeholder */}
                        <div className="relative z-10 w-full aspect-[469/703] bg-[#E5E5E5] flex items-center justify-center rounded-[50px]">
                            <span className="font-secondary text-xs tracking-widest uppercase text-[#A8A29E]">
                                Miejsce na zdjęcie (469x703)
                            </span>
                        </div>
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
        </div>
    )
}
