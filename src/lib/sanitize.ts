import type { ClothingItem } from "../types/clothing";
import type { Brand } from "../types/brand";
import { seedItem } from "./seed";

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

// 숫자로도 글자로도 들어올 수 있는 칸 (가격·치수). 가격은 lib/price.ts가 따로 숫자로 정리한다
const NUM_OR_TEXT = new Set([
  "price", "purchasePrice", "lengthCm", "chestCm", "shoulderCm", "sleeveCm",
  "waistCm", "hipCm", "riseCm", "hemCm", "bagWidthCm", "bagHeightCm", "bagDepthCm",
]);

function fits(def: unknown, v: unknown, key: string): boolean {
  if (Array.isArray(def)) return Array.isArray(v);
  if (typeof def === "boolean") return typeof v === "boolean";
  if (typeof def === "number") return typeof v === "number" || (NUM_OR_TEXT.has(key) && typeof v === "string");
  if (typeof def === "string") return typeof v === "string" || (NUM_OR_TEXT.has(key) && typeof v === "number");
  return true; // 기본값이 null인 칸(삭제 시각 등)은 검사하지 않는다
}

/**
 * 저장된 항목이 화면에서 안전하게 쓰일 수 있는 모양인지 확인하고, 빠졌거나 모양이 틀린 칸은 기본값으로 채운다.
 *  - id가 없거나 객체가 아니면 읽을 수 없는 레코드이므로 null
 *  - 이미 괜찮으면 같은 객체를 그대로 돌려준다 (바뀐 것만 골라 저장하기 위해)
 */
export function sanitizeItem(raw: unknown): ClothingItem | null {
  if (!isObj(raw) || typeof raw.id !== "string" || raw.id === "") return null;
  const blank = seedItem({ id: raw.id }) as unknown as Rec;
  let out: Rec | null = null;
  for (const [key, def] of Object.entries(blank)) {
    if (key === "id") continue;
    if (!fits(def, raw[key], key)) {
      if (!out) out = { ...raw };
      out[key] = Array.isArray(def) ? [] : def;
    }
  }
  // 배열 안의 값도 확인한다 (예: 소재 목록에 null이 섞여 있으면 화면이 멈춘다)
  const arrayRules: [string, (x: unknown) => boolean][] = [
    ["seasons", (x) => typeof x === "string"],
    ["images", (x) => typeof x === "string"],
    ["materials", isObj],
  ];
  for (const [key, ok] of arrayRules) {
    const v = (out ?? raw)[key];
    if (Array.isArray(v) && !v.every(ok)) {
      if (!out) out = { ...raw };
      out[key] = v.filter(ok);
    }
  }
  return (out ?? raw) as unknown as ClothingItem;
}

const BRAND_DEFAULTS: Rec = { name: "", logo: "", memo: "", favorite: false, color: "#B8B8B8" };

/** 브랜드도 같은 방식으로 정리한다. 삭제된 기능(브랜드 티어)의 값이 남아 있으면 지운다 */
export function sanitizeBrand(raw: unknown): Brand | null {
  if (!isObj(raw) || typeof raw.id !== "string" || raw.id === "") return null;
  let out: Rec | null = null;
  for (const [key, def] of Object.entries(BRAND_DEFAULTS)) {
    if (typeof raw[key] !== typeof def) {
      if (!out) out = { ...raw };
      out[key] = def;
    }
  }
  if ("tier" in raw) {
    if (!out) out = { ...raw };
    delete out.tier;
  }
  return (out ?? raw) as unknown as Brand;
}

export interface SanitizeResult<T> {
  /** 읽을 수 있는 레코드 (필요하면 기본값으로 채워진 것) */
  items: T[];
  /** items 중 원본과 달라져서 다시 저장해야 하는 것 */
  changed: T[];
  /** 읽을 수 없어 건너뛴 개수 */
  skipped: number;
}

export function sanitizeList<T>(list: unknown[], fn: (x: unknown) => T | null): SanitizeResult<T> {
  const items: T[] = [];
  const changed: T[] = [];
  let skipped = 0;
  for (const raw of list) {
    const v = fn(raw);
    if (v === null) { skipped++; continue; }
    items.push(v);
    if ((v as unknown) !== raw) changed.push(v);
  }
  return { items, changed, skipped };
}
