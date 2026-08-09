"use server"

import { redirect } from "next/navigation"

export async function logout() {
    // TODO: clear the session once authentication exists;
    redirect("/")
}
