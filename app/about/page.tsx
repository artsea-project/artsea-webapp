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

    return (
        <div className="w-full">
            {/* 1. Hero Section (O mnie - krótko) */}
            <section className="max-w-[1440px] mx-auto px-10 md:px-32 pt-24 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Left: Giant Titles */}
                    <div className="md:col-span-6 flex flex-col justify-between h-full">
                        <div className="flex flex-col mb-32">
                            <h1 className="font-primary text-[96px] leading-[1] font-normal tracking-tight">
                                {profile.fullName}
                            </h1>
                            <h2 className="font-primary text-[96px] leading-[1] font-normal tracking-tight text-[#A8A29E] italic">
                                O mnie
                            </h2>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
