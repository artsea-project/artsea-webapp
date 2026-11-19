"use server"

import type { CategoryFormState, TagFormState } from "@/lib/categories/form-state"
import {
    createCategory as createCategoryMutation,
    updateCategory as updateCategoryMutation,
    deleteCategory as deleteCategoryMutation,
    createTag as createTagMutation,
    updateTag as updateTagMutation,
    deleteTag as deleteTagMutation,
} from "@/lib/categories/mutations"
import type { DeleteCategoryResult, DeleteTagResult } from "@/lib/categories/mutations"

export type {
    DeleteResult,
    DeleteCategoryResult,
    DeleteTagResult,
} from "@/lib/categories/mutations"

export async function createCategory(
    previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    return createCategoryMutation(previous, formData)
}

export async function updateCategory(
    previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    return updateCategoryMutation(previous, formData)
}

export async function deleteCategory(categoryId: string): Promise<DeleteCategoryResult> {
    return deleteCategoryMutation(categoryId)
}

export async function createTag(previous: TagFormState, formData: FormData): Promise<TagFormState> {
    return createTagMutation(previous, formData)
}

export async function updateTag(previous: TagFormState, formData: FormData): Promise<TagFormState> {
    return updateTagMutation(previous, formData)
}

export async function deleteTag(tagId: string): Promise<DeleteTagResult> {
    return deleteTagMutation(tagId)
}
