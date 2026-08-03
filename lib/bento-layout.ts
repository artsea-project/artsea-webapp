import type { BentoLayoutItem } from "@/types/bento";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLayoutItem(value: unknown, columnCount: number): value is BentoLayoutItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  const numericFields = ["columnStart", "rowStart", "columnSpan", "rowSpan"] as const;

  return typeof item.artPieceId === "string"
    && UUID_PATTERN.test(item.artPieceId)
    && typeof item.mediaId === "string"
    && UUID_PATTERN.test(item.mediaId)
    && numericFields.every((field) => Number.isInteger(item[field]) && Number(item[field]) > 0)
    && Number(item.columnStart) + Number(item.columnSpan) - 1 <= columnCount;
}

export function normalizeBentoLayout(layout: unknown, columnCount: number): BentoLayoutItem[] {
  if (!layout || typeof layout !== "object" || !Array.isArray((layout as { items?: unknown }).items)) {
    return [];
  }

  return (layout as { items: unknown[] }).items.filter((item): item is BentoLayoutItem => isLayoutItem(item, columnCount));
}
