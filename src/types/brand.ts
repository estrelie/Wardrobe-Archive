import type { BrandTier } from "./common";
import type { ClothingItem } from "./clothing";

// --- src/types/brand.ts ---
export interface Brand {
  id: string;
  name: string;
  tier: BrandTier | string;
  logo: string;
  memo: string;
  favorite: boolean;
  color: string;
}

export interface BrandWithStats extends Brand {
  items: ClothingItem[];
  total: number;
  latestAddedAt: number;
}
