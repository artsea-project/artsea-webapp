export interface BentoLayoutItem {
  artPieceId: string;
  mediaId: string;
  columnStart: number;
  rowStart: number;
  columnSpan: number;
  rowSpan: number;
}

export interface BentoLayout {
  items: BentoLayoutItem[];
}

export interface BentoBoxLayout {
  desktop: BentoLayout;
  mobile: BentoLayout;
}
