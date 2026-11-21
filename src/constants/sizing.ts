import type { ClothingItem } from "../types/clothing";
import { SIZE_OPTIONS_BY_TYPE } from "./design";

/* ---------------------------------------------------------
   Category-aware detailed sizing
--------------------------------------------------------- */
type SizeFieldKey = keyof ClothingItem;
interface SizeField { key: SizeFieldKey; label: string; }

const SIZE_FIELD_SETS: Record<string, SizeField[]> = {
  top: [
    { key: "lengthCm", label: "총장" },
    { key: "chestCm", label: "가슴단면" },
    { key: "shoulderCm", label: "어깨" },
    { key: "sleeveCm", label: "소매" },
  ],
  outer: [
    { key: "lengthCm", label: "총장" },
    { key: "chestCm", label: "가슴단면" },
    { key: "shoulderCm", label: "어깨" },
    { key: "sleeveCm", label: "소매" },
  ],
  bottom: [
    { key: "waistCm", label: "허리" },
    { key: "hipCm", label: "힙" },
    { key: "riseCm", label: "밑위" },
    { key: "hemCm", label: "밑단" },
    { key: "lengthCm", label: "총장" },
  ],
  bag: [
    { key: "bagWidthCm", label: "가로" },
    { key: "bagHeightCm", label: "세로" },
    { key: "bagDepthCm", label: "폭" },
  ],
};

export const CATEGORY_SIZE_TYPE: Record<string, string> = {
  // Tops
  "T-shirt": "top",
  "Long Sleeve": "top",
  "Shirt": "top",
  "Blouse": "top",
  "Knit": "top",
  "Sweatshirt": "top",
  "Hoodie": "top",
  "Sleeveless": "top",

  // Dress
  "Dress": "top",

  // Bottoms
  "Denim": "bottom",
  "Slacks": "bottom",
  "Pants": "bottom",
  "Shorts": "bottom",
  "Skirt": "bottom",

  // Outerwear
  "Jacket": "outer",
  "Coat": "outer",
  "Padding": "outer",

  // Others
  "Shoes": "shoes",
  "Bag": "bag",
  "Accessories": "none",
};

export function getSizeFields(category: string): SizeField[] | null {
  const type = CATEGORY_SIZE_TYPE[category] ?? "top";
  if (type === "none") return null;
  return SIZE_FIELD_SETS[type] || null;
}

export function getSizeOptions(category: string): string[] {
  const type = CATEGORY_SIZE_TYPE[category] ?? "top";
  if (type === "bottom") return SIZE_OPTIONS_BY_TYPE.bottom;
  if (category === "Shoes") return SIZE_OPTIONS_BY_TYPE.shoes;
  if (category === "Bag") return SIZE_OPTIONS_BY_TYPE.bag;
  if (type === "none") return SIZE_OPTIONS_BY_TYPE.none;
  return SIZE_OPTIONS_BY_TYPE.top;
}
