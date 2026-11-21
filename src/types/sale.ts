import type { MaterialLibraryItem } from "./material";
import type { ReferenceImage } from "./reference";
import type { Brand } from "./brand";
import type { ClothingItem } from "./clothing";

// --- src/types/sale.ts ---
export interface SaleRecord {
  id: string;
  itemId: string;
  brandName: string;
  name: string;
  soldPrice: number;
  soldDate: string;
  createdAt: number;
}

export interface ArchiveSettings {
  gallerySize: number;
  autoDeleteDays: number | null;
}

export interface ArchiveData {
  version: number;
  exportedAt: string;
  items: ClothingItem[];
  brands: Brand[];
  materials: MaterialLibraryItem[];
  references: ReferenceImage[];
  sales: SaleRecord[];
  settings: ArchiveSettings;
}
