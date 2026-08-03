import type { BentoCardData, BentoData } from "@/lib/bento";

import { BentoCard } from "./bento-card";

const DESKTOP_COLUMN_START = {
  1: "col-start-1", 2: "col-start-2", 3: "col-start-3", 4: "col-start-4", 5: "col-start-5", 6: "col-start-6", 7: "col-start-7", 8: "col-start-8", 9: "col-start-9", 10: "col-start-10", 11: "col-start-11",
} as const;
const DESKTOP_COLUMN_SPAN = {
  1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4", 5: "col-span-5", 6: "col-span-6", 7: "col-span-7", 8: "col-span-8", 9: "col-span-9", 10: "col-span-10", 11: "col-span-11",
} as const;
const MOBILE_COLUMN_START = { 1: "col-start-1", 2: "col-start-2" } as const;
const MOBILE_COLUMN_SPAN = { 1: "col-span-1", 2: "col-span-2" } as const;
const ROW_START = {
  1: "row-start-1", 2: "row-start-2", 3: "row-start-3", 4: "row-start-4", 5: "row-start-5", 6: "row-start-6", 7: "row-start-7", 8: "row-start-8", 9: "row-start-9", 10: "row-start-10", 11: "row-start-11", 12: "row-start-12", 13: "row-start-13", 14: "row-start-14", 15: "row-start-15", 16: "row-start-16", 17: "row-start-17", 18: "row-start-18", 19: "row-start-19", 20: "row-start-20", 21: "row-start-21", 22: "row-start-22", 23: "row-start-23", 24: "row-start-24", 25: "row-start-25", 26: "row-start-26", 27: "row-start-27", 28: "row-start-28", 29: "row-start-29", 30: "row-start-30", 31: "row-start-31", 32: "row-start-32",
} as const;
const ROW_SPAN = {
  1: "row-span-1", 2: "row-span-2", 3: "row-span-3", 4: "row-span-4", 5: "row-span-5", 6: "row-span-6", 7: "row-span-7", 8: "row-span-8", 9: "row-span-9", 10: "row-span-10", 11: "row-span-11", 12: "row-span-12", 13: "row-span-13", 14: "row-span-14", 15: "row-span-15", 16: "row-span-16", 17: "row-span-17", 18: "row-span-18", 19: "row-span-19", 20: "row-span-20", 21: "row-span-21", 22: "row-span-22", 23: "row-span-23", 24: "row-span-24", 25: "row-span-25", 26: "row-span-26", 27: "row-span-27", 28: "row-span-28", 29: "row-span-29", 30: "row-span-30", 31: "row-span-31", 32: "row-span-32",
} as const;

type LayoutKind = "desktop" | "mobile";

function cardClasses(card: BentoCardData, kind: LayoutKind) {
  const columnStart = kind === "desktop"
    ? DESKTOP_COLUMN_START[card.columnStart as keyof typeof DESKTOP_COLUMN_START]
    : MOBILE_COLUMN_START[card.columnStart as keyof typeof MOBILE_COLUMN_START];
  const columnSpan = kind === "desktop"
    ? DESKTOP_COLUMN_SPAN[card.columnSpan as keyof typeof DESKTOP_COLUMN_SPAN]
    : MOBILE_COLUMN_SPAN[card.columnSpan as keyof typeof MOBILE_COLUMN_SPAN];
  const rowStart = ROW_START[card.rowStart as keyof typeof ROW_START];
  const rowSpan = ROW_SPAN[card.rowSpan as keyof typeof ROW_SPAN];

  return [columnStart, columnSpan, rowStart, rowSpan].every(Boolean)
    ? `${columnStart} ${columnSpan} ${rowStart} ${rowSpan}`
    : null;
}

function Layout({ cards, kind }: { cards: BentoCardData[]; kind: LayoutKind }) {
  const classes = kind === "desktop"
    ? "hidden grid-cols-11 auto-rows-[21px] gap-x-[21px] gap-y-8 md:grid"
    : "grid grid-cols-2 auto-rows-[28px] gap-3 md:hidden";

  return (
    <div className={classes}>
      {cards.map((card) => {
        const className = cardClasses(card, kind);
        return className && <BentoCard card={card} className={className} key={`${kind}-${card.artPieceId}-${card.mediaId}`} sizes={kind === "desktop" ? "(min-width: 1280px) 420px, (min-width: 768px) 35vw" : "(max-width: 767px) 90vw"} />;
      })}
    </div>
  );
}

export function BentoBox({ data }: { data: BentoData }) {
  return (
    <>
      <Layout cards={data.desktop} kind="desktop" />
      <Layout cards={data.mobile} kind="mobile" />
    </>
  );
}
