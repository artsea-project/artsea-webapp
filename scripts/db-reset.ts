import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { Client, escapeIdentifier } from "pg"
import { deleteSetupToken } from "@/lib/auth/setup-token"

async function main() {
    const { parsed } = config({
        path: fileURLToPath(new URL("../.env.local", import.meta.url)),
        quiet: true,
    })
    const connectionString = parsed?.DATABASE_URL
    if (!connectionString || connectionString !== process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL must match the value in this checkout's .env.local.")
    }

    const url = new URL(connectionString)
    const database = decodeURIComponent(url.pathname.slice(1))
    // Without an explicit database name, pg can fall back to PGDATABASE or the connection user.
    if (!database) {
        throw new Error("DATABASE_URL must explicitly name the database to reset.")
    }
    if (process.env.NODE_ENV === "production" || url.search) {
        throw new Error(
            "Reset disallowed in production environment and with DATABASE_URL query parameters."
        )
    }

    const input = createInterface({ input: stdin, output: stdout })
    input.setPrompt(
        `Delete all Artsea data in ${database} at ${url.hostname}:${url.port || "5432"}? [y/N] `
    )
    input.prompt()
    const answer = await input[Symbol.asyncIterator]().next()
    input.close()
    if (answer.done || answer.value.trim().toLowerCase() !== "y") {
        console.log("Reset cancelled.")
        return
    }

    const client = new Client({ connectionString })
    try {
        await client.connect()
        await client.query("BEGIN")
        const { rows } = await client.query<{ tablename: string }>(`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `)
        if (rows.length === 0) {
            throw new Error("No app tables found. Set up the database schema first.")
        }
        const tables = rows.map(({ tablename }) => `public.${escapeIdentifier(tablename)}`)
        await client.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY`)
        await deleteSetupToken()
        await client.query("COMMIT")
    } finally {
        await client.end()
    }

    console.log("Database reset. Run npm run auth:first-login to create a new setup link.")
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`Unable to reset the database: ${message}`)
    process.exitCode = 1
})
