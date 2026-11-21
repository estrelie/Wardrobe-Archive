import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import { BRAND_TIERS } from "../constants/design";
import { findBrandByName } from "./brandName";

/**
 * 항목들이 존재하는 브랜드에 제대로 연결되어 있는지 확인하고, 끊긴 연결을 되살린다.
 *  - 브랜드 이름이 있는데 brandId가 비었거나 없는 브랜드를 가리키면:
 *      같은 이름의 브랜드가 있으면 그쪽에 연결하고, 없으면 새 브랜드를 만든다.
 *      (새 브랜드는 원래 brandId를 그대로 써서, 같은 브랜드를 가리키던 다른 항목도 함께 연결된다)
 *  - 이미 잘 연결된 항목과 브랜드가 없는 항목은 그대로 둔다 (같은 객체를 그대로 돌려줌)
 * 반환되는 items는 targets와 같은 길이·순서이다.
 */
export function planBrandRelink(
  targets: ClothingItem[],
  brands: Brand[]
): { items: ClothingItem[]; newBrands: Brand[] } {
  const known: Brand[] = [...brands];
  const newBrands: Brand[] = [];

  const items = targets.map((it) => {
    const name = (it.brandName || "").trim();
    if (!name) return it;
    if (it.brandId && known.some((b) => b.id === it.brandId)) return it;

    let brand = findBrandByName(known, name);
    if (!brand) {
      brand = {
        id: it.brandId || crypto.randomUUID(),
        name,
        tier: BRAND_TIERS[5],
        logo: "",
        memo: "",
        favorite: false,
        color: "#B8B8B8",
      };
      known.push(brand);
      newBrands.push(brand);
    }
    return { ...it, brandId: brand.id, brandName: brand.name };
  });

  return { items, newBrands };
}
