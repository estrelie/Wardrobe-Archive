import type { ClothingItem } from "../types/clothing";
import type { PurchaseRecord } from "../types/purchase";

/** 입력값을 가격(숫자)으로 바꾼다. 비어 있거나 숫자가 아니면 "" (가격 없음) */
export function toPrice(v: unknown): number | "" {
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return "";
    const n = Number(t);
    return Number.isFinite(n) ? n : "";
  }
  return "";
}

/**
 * 가격이 문자열("0150000")로 저장된 항목을 숫자로 바로잡는다.
 * 이미 숫자(또는 빈 값)면 같은 객체를 그대로 돌려준다 (바뀐 항목만 골라내기 위해).
 */
export function normalizeItemPrices(it: ClothingItem): ClothingItem {
  const isStr = (v: unknown) => typeof v === "string" && v !== "";
  if (!isStr(it.price) && !isStr(it.purchasePrice) && !isStr(it.soldPrice)) return it;
  return {
    ...it,
    price: toPrice(it.price),
    purchasePrice: toPrice(it.purchasePrice),
    ...(isStr(it.soldPrice) ? { soldPrice: toPrice(it.soldPrice) } : {}),
  };
}

export function normalizeRecordPrice(r: PurchaseRecord): PurchaseRecord {
  return typeof r.purchasePrice === "string" && r.purchasePrice !== "" ? { ...r, purchasePrice: toPrice(r.purchasePrice) } : r;
}
