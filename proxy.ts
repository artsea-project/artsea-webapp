import createMiddleware from "next-intl/middleware"

import { routing } from "@/i18n/routing"

export default createMiddleware(routing)

export const config = {
    // Everything except the admin panel, API, media and profile image routes, Next internals
    // and static files.
    matcher: "/((?!api|admin|media|profile-image|_next|.*\\..*).*)",
}
