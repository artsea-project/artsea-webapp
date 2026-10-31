import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "25mb",
        },
        globalNotFound: true,
    },
}

export default nextConfig
