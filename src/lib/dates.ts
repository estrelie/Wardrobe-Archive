import type { ClothingItem } from "../types/clothing";
import type { PurchaseRecord } from "../types/purchase";

/**
 * 구매일을 "YYYY-MM-DD"로 맞춘다.
 *  - 비어 있으면 ""  (구매일 없음)
 *  - 20260305, 2026/3/5, 2026.03.05, 2026-3-5 처럼 날짜로 읽을 수 있으면 YYYY-MM-DD
 *  - 읽을 수 없거나 존재하지 않는 날짜(20261345)이면 null
 */
export function normalizePurchaseDate(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return "";
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (t === "") return "";
  const m = /^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${m[1]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 저장된 항목의 구매일을 바로잡는다. 읽을 수 없는 값은 비운다. 이미 올바르면 같은 객체를 돌려준다 */
export function normalizeItemDates(it: ClothingItem): ClothingItem {
  const fixed = normalizePurchaseDate(it.purchaseDate) ?? "";
  return fixed === it.purchaseDate ? it : { ...it, purchaseDate: fixed };
}

export function normalizeRecordDate(r: PurchaseRecord): PurchaseRecord {
  const fixed = normalizePurchaseDate(r.purchaseDate) ?? "";
  return fixed === r.purchaseDate ? r : { ...r, purchaseDate: fixed };
}
