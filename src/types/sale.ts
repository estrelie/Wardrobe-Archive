import type { MaterialLibraryItem } from "./material";
import type { ReferenceImage } from "./reference";
import type { Brand } from "./brand";
import type { ClothingItem } from "./clothing";
import type { PurchaseRecord } from "./purchase";

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
  /** 영구 삭제된 옷의 구매 기록 (이 기능이 생기기 전에 만든 백업 파일에는 없다) */
  purchases?: PurchaseRecord[];
  settings: ArchiveSettings;
}
