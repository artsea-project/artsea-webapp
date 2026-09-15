import { Writable } from "node:stream"
import { createInterface } from "node:readline/promises"

export async function promptHidden(question: string): Promise<string> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
            "An interactive terminal is required. In Docker, run this command with docker compose exec."
        )
    }

    const mutedOutput = new Writable({
        write(_chunk, _encoding, callback) {
            callback()
        },
    })
    const prompt = createInterface({
        input: process.stdin,
        output: mutedOutput,
        terminal: true,
    })
    process.stdout.write(question)

    try {
        return await prompt.question("")
    } finally {
        prompt.close()
        process.stdout.write("\n")
    }
}
