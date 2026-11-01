import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "3mb",
        },
        globalNotFound: true,
    },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
