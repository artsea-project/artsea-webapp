import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "25mb",
        },
    },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
