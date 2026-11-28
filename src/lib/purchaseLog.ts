import type { ClothingItem } from "../types/clothing";
import type { PurchaseRecord } from "../types/purchase";
import { toPrice } from "./price";
import { normalizePurchaseDate } from "./dates";

/** owned: 옷장에 있음 / bin: 휴지통에 있음 / removed: 영구 삭제되어 구매 기록만 남음 */
export type PurchaseStatus = "owned" | "bin" | "removed";

export interface PurchaseEntry {
  id: string;
  status: PurchaseStatus;
  name: string;
  brandName: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number | "";
  image: string;
  /** 옷장에 있는 항목만 (서랍 열기용) */
  item?: ClothingItem;
}

const DAY_MS = 24 * 3600 * 1000;

/** "YYYY-MM-DD..." 형태면 그대로 읽고, 아니면 Date로 해석한다 (시간대 때문에 하루 밀리는 것을 피한다) */
export function parseYmd(dateStr: string): { y: number; m: number; d: number } | null {
  const hit = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (hit) return { y: Number(hit[1]), m: Number(hit[2]), d: Number(hit[3]) };
  const t = new Date(dateStr);
  if (!dateStr || Number.isNaN(t.getTime())) return null;
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

/** 날짜를 "1970-01-01로부터 며칠째"인 정수로 바꾼다 (일 단위 차이 계산용) */
export function dayNumber(dateStr: string): number | null {
  const p = parseYmd(dateStr);
  return p ? Math.floor(Date.UTC(p.y, p.m - 1, p.d) / DAY_MS) : null;
}

/** 옷장 항목 + 휴지통 항목 + 영구 삭제 기록을 하나의 구매 기록 목록으로 합친다 */
export function buildPurchaseEntries(items: ClothingItem[], records: PurchaseRecord[]): PurchaseEntry[] {
  const entries: PurchaseEntry[] = [];
  const itemIds = new Set(items.map((i) => i.id));

  for (const it of items) {
    if (!it.purchaseDate) continue;
    entries.push({
      id: it.id,
      status: it.deleted ? "bin" : "owned",
      name: it.name,
      brandName: it.brandName,
      category: String(it.category),
      purchaseDate: it.purchaseDate,
      purchasePrice: it.purchasePrice,
      image: it.images?.[0] || "",
      item: it.deleted ? undefined : it,
    });
  }
  for (const r of records) {
    if (itemIds.has(r.id)) continue; // 항목이 (다시) 존재하면 항목을 기준으로 한다
    if (!r.purchaseDate) continue;
    entries.push({
      id: r.id,
      status: "removed",
      name: r.name,
      brandName: r.brandName,
      category: r.category,
      purchaseDate: r.purchaseDate,
      purchasePrice: r.purchasePrice,
      image: r.thumbnail || "",
    });
  }
  return entries;
}

/** 영구 삭제되는 항목에서 구매 기록을 만든다. 구매일이 없으면 남길 기록이 없으므로 null */
export function recordFromItem(item: ClothingItem, thumbnail: string): PurchaseRecord | null {
  const purchaseDate = normalizePurchaseDate(item.purchaseDate);
  if (!purchaseDate) return null;
  return {
    id: item.id,
    brandName: item.brandName,
    name: item.name,
    category: String(item.category),
    purchaseDate,
    purchasePrice: toPrice(item.purchasePrice),
    thumbnail,
    removedAt: Date.now(),
  };
}

export interface PurchaseStats {
  count: number;
  spend: number;
  avgGap: number;
  daysSinceLast: number;
}

/**
 * 캘린더 상단 카드 값.
 *  - count / spend: 이번 달(monthEntries) 기준
 *  - avgGap / daysSinceLast: 전체(allEntries)에서 "구매한 날"을 기준으로 계산한다.
 *    같은 날 여러 벌을 사도 구매 1회로 센다.
 */
export function purchaseStats(allEntries: PurchaseEntry[], monthEntries: PurchaseEntry[], today: Date): PurchaseStats {
  const count = monthEntries.length;
  const spend = monthEntries.reduce((sum, e) => sum + Number(e.purchasePrice || 0), 0);

  const days = Array.from(
    new Set(allEntries.map((e) => dayNumber(e.purchaseDate)).filter((n): n is number => n !== null))
  ).sort((a, b) => a - b);

  // 구매일 사이 간격의 평균 = (마지막 - 처음) / (구매일 수 - 1)
  const avgGap = days.length > 1 ? Math.round((days[days.length - 1] - days[0]) / (days.length - 1)) : 0;

  const todayNum = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / DAY_MS);
  const daysSinceLast = days.length > 0 ? Math.max(0, todayNum - days[days.length - 1]) : 0;

  return { count, spend, avgGap, daysSinceLast };
}
