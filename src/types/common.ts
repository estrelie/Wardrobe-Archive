/* =========================================================
   TYPES SECTION
========================================================= */

// --- src/types/common.ts ---
export type Category =
  | "T-shirt"
  | "Long Sleeve"
  | "Shirt"
  | "Blouse"
  | "Knit"
  | "Sweatshirt"
  | "Hoodie"
  | "Sleeveless"
  | "Dress"
  | "Denim"
  | "Slacks"
  | "Pants"
  | "Shorts"
  | "Skirt"
  | "Jacket"
  | "Coat"
  | "Padding"
  | "Shoes"
  | "Bag"
  | "Accessories";
export type CategoryGroup =
  | "Tops"
  | "Dress"
  | "Bottoms"
  | "Outerwear"
  | "Others";
export type Season = "여름" | "봄/가을" | "겨울";
export type DeclutterMethod = "중고 거래" | "처분";
export type PageType = "wardrobe" | "brands" | "stats" | "calendar" | "trash";
export type ViewMode = "gallery" | "table";
