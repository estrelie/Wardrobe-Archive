import type { Category, DeclutterMethod, Season } from "./common";
import type { Material } from "./material";
import type { Brand } from "./brand";

// --- src/types/clothing.ts ---
export interface ClothingItem {
  id: string;
  images: string[];
  brandId: string;
  brandName: string;
  name: string;
  category: Category | string;
  seasons: Season[];
  price: number | "";
  purchasePrice: number | "";
  purchasePlace: string;
  purchaseDate: string;
  addedAt: number;
  size: string;
  materials: Material[];
  lengthCm: number | string;
  chestCm: number | string;
  shoulderCm: number | string;
  sleeveCm: number | string;
  waistCm: number | string;
  hipCm: number | string;
  riseCm: number | string;
  hemCm: number | string;
  bagWidthCm: number | string;
  bagHeightCm: number | string;
  bagDepthCm: number | string;
  favorite: boolean;
  memo: string;
  materialNote: string;
  repairNeeded: boolean;
  declutter: boolean;
  declutterMethod: DeclutterMethod | string;
  deleted?: boolean;
  deletedAt?: string | null;
  soldPrice?: number | "" | null;
  soldDate?: string | null;
  brandInfo?: Brand;
}

export interface ClothingDraft extends ClothingItem {
  _newBrandLogo?: string;
}
