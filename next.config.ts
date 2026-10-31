import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "3mb",
        },
        globalNotFound: true,
    },
}

export default nextConfig
