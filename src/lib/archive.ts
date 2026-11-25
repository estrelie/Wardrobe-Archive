import type { MaterialLibraryItem } from "../types/material";
import type { ReferenceImage } from "../types/reference";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import type { ArchiveData, SaleRecord } from "../types/sale";
import type { PurchaseRecord } from "../types/purchase";
import { storeCount, storeListLoad } from "./storage";

/** 저장소의 모든 데이터를 백업 파일(ArchiveData) 형태로 읽어 온다. 앱 화면 상태와 무관하게 저장소에서 직접 읽는다 */
export async function buildArchive(): Promise<ArchiveData> {
  const items = await storeListLoad<ClothingItem>("item:");
  const brands = await storeListLoad<Brand>("brand:");
  const materials = await storeListLoad<MaterialLibraryItem>("material:");
  const references = await storeListLoad<ReferenceImage>("reference:");
  const sales = await storeListLoad<SaleRecord>("sale:");
  const purchases = await storeListLoad<PurchaseRecord>("purchase:");
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
    brands,
    materials,
    references,
    sales,
    purchases,
    settings: {
      gallerySize: Number(localStorage.getItem("wardrobe_gallery_size")) || 200,
      autoDeleteDays: localStorage.getItem("wardrobe_auto_delete_days") === "null" ? null : Number(localStorage.getItem("wardrobe_auto_delete_days")),
    },
  };
}

/** 백업 파일 이름: Archive_2026-11-23.json (이 컴퓨터의 날짜 기준) */
export function archiveFileName(suffix: string = ""): string {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `Archive_${date}${suffix}.json`;
}

/** 데이터를 JSON 파일로 내려받는다 */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ArchiveCounts {
  items: number;
  brands: number;
  purchases: number;
}

/** 지금 저장소에 들어 있는 레코드 개수 (가져오기 확인창의 비교용) */
export async function currentCounts(): Promise<ArchiveCounts> {
  const [items, brands, purchases] = await Promise.all([storeCount("item:"), storeCount("brand:"), storeCount("purchase:")]);
  return { items, brands, purchases };
}
