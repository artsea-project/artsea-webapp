import { randomBytes, timingSafeEqual } from "node:crypto"
import { constants } from "node:fs"
import { lstat, mkdir, open, rm, type FileHandle } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const TOKEN_BYTES = 32
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const TOKEN_FILE_NAME = "first-login-token"
const isWindows = process.platform === "win32"
const noFollow = isWindows ? 0 : constants.O_NOFOLLOW

function getAuthRuntimeDirectory() {
    const base = isWindows
        ? (process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"))
        : os.tmpdir()
    return process.env.ARTSEA_RUNTIME_DIR ?? path.join(base, "artsea")
}

export async function getOrCreateSetupToken(
    runtimeDirectory = getAuthRuntimeDirectory()
): Promise<string> {
    await ensurePrivateRuntimeDirectory(runtimeDirectory)
    const tokenPath = path.join(runtimeDirectory, TOKEN_FILE_NAME)

    const existing = await readSetupToken(tokenPath)
    if (existing) {
        return existing
    }

    const token = randomBytes(TOKEN_BYTES).toString("base64url")

    try {
        const file = await open(
            tokenPath,
            constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow,
            0o600
        )
        try {
            await file.writeFile(`${token}\n`, { encoding: "utf8" })
            await file.sync()
        } finally {
            await file.close()
        }
        return token
    } catch (error) {
        if (!isAlreadyExistsError(error)) {
            throw error
        }

        const concurrentlyCreated = await readSetupToken(tokenPath)
        if (!concurrentlyCreated) {
            throw new Error("The first-login token file is invalid.")
        }
        return concurrentlyCreated
    }
}

export async function verifySetupToken(
    candidate: string,
    runtimeDirectory = getAuthRuntimeDirectory()
): Promise<boolean> {
    try {
        await ensurePrivateRuntimeDirectory(runtimeDirectory, false)
    } catch (error) {
        if (isNotFoundError(error)) {
            return false
        }
        throw error
    }

    const expected = await readSetupToken(path.join(runtimeDirectory, TOKEN_FILE_NAME))
    if (!expected) {
        return false
    }

    const candidateBuffer = Buffer.from(candidate)
    const expectedBuffer = Buffer.from(expected)

    return (
        candidateBuffer.length === expectedBuffer.length &&
        timingSafeEqual(candidateBuffer, expectedBuffer)
    )
}

export async function deleteSetupToken(runtimeDirectory = getAuthRuntimeDirectory()) {
    await rm(path.join(runtimeDirectory, TOKEN_FILE_NAME), { force: true })
}

async function ensurePrivateRuntimeDirectory(runtimeDirectory: string, create = true) {
    if (create) {
        await mkdir(runtimeDirectory, { recursive: true, mode: 0o700 })
    }

    const stats = await lstat(runtimeDirectory)
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error("The authentication runtime path must be a regular directory.")
    }
    if (!isWindows && (stats.mode & 0o022) !== 0) {
        throw new Error("The authentication runtime directory must not be group/world writable.")
    }
    assertOwnedByCurrentUser(stats.uid, "runtime directory")
}

async function readSetupToken(tokenPath: string): Promise<string | null> {
    let file: FileHandle | undefined
    try {
        // Windows uses inherited ACLs and does not support O_NOFOLLOW.
        if (isWindows && !(await lstat(tokenPath)).isFile()) {
            throw new Error("The first-login token path must be a regular file.")
        }
        file = await open(tokenPath, constants.O_RDONLY | noFollow)
        const stats = await file.stat()
        if (!stats.isFile() || stats.nlink !== 1) {
            throw new Error("The first-login token path must be a regular file with one link.")
        }
        if (!isWindows && (stats.mode & 0o077) !== 0) {
            throw new Error("The first-login token file permissions must be 0600.")
        }
        assertOwnedByCurrentUser(stats.uid, "token file")

        const token = (await file.readFile({ encoding: "utf8" })).trimEnd()
        if (!TOKEN_PATTERN.test(token)) {
            throw new Error("The first-login token file is invalid.")
        }
        return token
    } catch (error) {
        if (isNotFoundError(error)) {
            return null
        }
        if (isSymbolicLinkError(error)) {
            throw new Error("The first-login token path must be a regular file.")
        }
        throw error
    } finally {
        await file?.close()
    }
}

function assertOwnedByCurrentUser(ownerId: number, resource: string) {
    const effectiveUserId = process.geteuid?.()
    if (effectiveUserId !== undefined && ownerId !== effectiveUserId) {
        throw new Error(`The authentication ${resource} must be owned by the current user.`)
    }
}

function isAlreadyExistsError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "EEXIST"
}

function isNotFoundError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT"
}

function isSymbolicLinkError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ELOOP"
}
