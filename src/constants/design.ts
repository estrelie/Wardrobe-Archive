import type {
  Category,
  CategoryGroup,
  DeclutterMethod,
  Season,
} from "../types/common";

/* ---------------------------------------------------------
   Design tokens & Constants
--------------------------------------------------------- */
export const COLOR = {
  bg: "#FFFFFF",
  bg2: "#FAFAF8",
  border: "#E8E8E8",
  text: "#111111",
  subtext: "#777777",
};

export const GRAYS: string[] = [
  "#454545",
  "#666666",
  "#818181",
  "#A0A0A0",
  "#C3C3C3"];
export const CATEGORIES: Category[] = [
  "T-shirt",
  "Long Sleeve",
  "Shirt",
  "Blouse",
  "Knit",
  "Sweatshirt",
  "Hoodie",
  "Sleeveless",

  "Dress",

  "Denim",
  "Slacks",
  "Pants",
  "Shorts",
  "Skirt",

  "Jacket",
  "Coat",
  "Padding",

  "Shoes",
  "Bag",
  "Accessories",];
export const CATEGORY_GROUPS: Record<CategoryGroup, Category[]> = {
  Tops: [
    "T-shirt",
    "Long Sleeve",
    "Shirt",
    "Blouse",
    "Knit",
    "Sweatshirt",
    "Hoodie",
    "Sleeveless",
  ],
  Dress: [
    "Dress",
  ],
  Bottoms: [
    "Denim",
    "Slacks",
    "Pants",
    "Shorts",
    "Skirt",
  ],
  Outerwear: [
    "Jacket",
    "Coat",
    "Padding",
  ],
  Others: [
    "Shoes",
    "Bag",
    "Accessories",
  ],
};
export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  Tops: "Tops",
  Bottoms: "Bottoms",
  Dress: "Dresses",
  Outerwear: "Outerwear",
  Others: "Others",
};
export const SEASONS: Season[] = ["여름", "봄/가을", "겨울"];
export const SIZE_OPTIONS_BY_TYPE: Record<string, string[]> = {
  top: ["XS", "S", "M", "L", "FREE"],
  bottom: [
    "26",
    "27",
    "28",
    "FREE",
  ],
  shoes: [
    "240",
    "245",
    "250",
    "FREE",
  ],
  bag: ["FREE"],
  none: [],
};
export const DECLUTTER_METHODS: DeclutterMethod[] = ["중고 거래", "처분"];
