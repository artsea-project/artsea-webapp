import { BentoBox } from "@/components/bento/bento-box"
import { getBentoData } from "@/lib/bento"

export default async function Home() {
    const data = await getBentoData()
    const hasWorks = data.desktop.length > 0 || data.mobile.length > 0

    return (
        <div className="min-h-screen bg-[#f7f5f1] px-5 py-12 text-stone-950 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
            <section
                aria-labelledby="selected-works-heading"
                className="mx-auto w-full max-w-[1155px]"
            >
                <h1
                    id="selected-works-heading"
                    className="mb-8 font-primary text-4xl leading-none tracking-[-0.03em] sm:mb-10 sm:text-5xl lg:text-[64px]"
                >
                    Selected works.
                </h1>
                {hasWorks ? (
                    <BentoBox data={data} />
                ) : (
                    <p className="py-16 text-base text-stone-600">
                        Selected works will appear here soon.
                    </p>
                )}
            </section>
        </div>
    )
}
