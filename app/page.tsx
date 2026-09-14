import { BentoBox } from "@/components/bento/bento-box"
import { getBentoData } from "@/lib/bento"

export default async function Home() {
    const data = await getBentoData()

    return (
        <div className="bg-white px-5 py-12 text-stone-950 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
            <section
                aria-labelledby="selected-works-heading"
                className="mx-auto w-full max-w-[1155px]"
            >
                <h1
                    id="selected-works-heading"
                    className="mb-8 font-primary text-4xl leading-none tracking-[-0.03em] sm:mb-10 sm:text-5xl lg:text-[56px]"
                >
                    Selected works.
                </h1>
                <BentoBox data={data} />
            </section>
        </div>
    )
}
