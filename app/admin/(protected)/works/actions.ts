"use server"

import { requireArtistSession } from "@/lib/auth/session"
import type { WorkFormState } from "@/lib/works/form-state"
import {
    createWork as createWorkMutation,
    updateWork as updateWorkMutation,
    setWorkVisibility as setWorkVisibilityMutation,
    deleteWork as deleteWorkMutation,
} from "@/lib/works/mutations"
import type { DeleteWorkResult, SetWorkVisibilityResult } from "@/lib/works/mutations"

export type { DeleteWorkResult, SetWorkVisibilityResult } from "@/lib/works/mutations"

export async function createWork(
    previous: WorkFormState,
    formData: FormData
): Promise<WorkFormState> {
    await requireArtistSession()
    return createWorkMutation(previous, formData)
}

export async function updateWork(
    previous: WorkFormState,
    formData: FormData
): Promise<WorkFormState> {
    await requireArtistSession()
    return updateWorkMutation(previous, formData)
}

export async function setWorkVisibility(
    artPieceId: string,
    isVisible: boolean
): Promise<SetWorkVisibilityResult> {
    await requireArtistSession()
    return setWorkVisibilityMutation(artPieceId, isVisible)
}

export async function deleteWork(artPieceId: string): Promise<DeleteWorkResult> {
    await requireArtistSession()
    return deleteWorkMutation(artPieceId)
}
