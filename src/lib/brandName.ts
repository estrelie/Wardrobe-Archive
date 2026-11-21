import type { Brand } from "../types/brand";

/** 브랜드 이름 비교용 키: 앞뒤 공백 제거, 연속 공백은 1칸, 대소문자 무시 */
export function normalizeBrandName(name: string | null | undefined): string {
  return (name ?? "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** 이름이 같은(대소문자·공백 무시) 브랜드를 찾는다. excludeId는 비교에서 뺄 브랜드(자기 자신) */
export function findBrandByName(
  brands: Brand[],
  name: string | null | undefined,
  excludeId?: string
): Brand | undefined {
  const key = normalizeBrandName(name);
  if (!key) return undefined;
  return brands.find((b) => b.id !== excludeId && normalizeBrandName(b.name) === key);
}
