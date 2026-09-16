"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { getAuth } from "@/lib/auth/server"

export async function logout() {
    const auth = await getAuth()
    const response = await auth.api.signOut({ headers: await headers(), asResponse: true })
    await applyAuthCookies(response)
    redirect("/admin/login")
}
