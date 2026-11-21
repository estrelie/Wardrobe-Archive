import type { ClothingItem } from "../types/clothing";
import { CATEGORIES, DECLUTTER_METHODS } from "../constants/design";

/* ---------------------------------------------------------
   Seed data
--------------------------------------------------------- */
export const seedItem = (over: Partial<ClothingItem> & { seed?: string }): ClothingItem => ({
  id: crypto.randomUUID(),
  images: over.seed ? [`https://picsum.photos/seed/${over.seed}/700/900`] : [],
  brandId: "",
  brandName: "",
  name: "",
  category: CATEGORIES[0],
  seasons: [],
  price: 0,
  purchasePrice: 0,
  purchasePlace: "",
  purchaseDate: "",
  addedAt: Date.now(), 
  size: "",
  materials: [],
  lengthCm: "",
  chestCm: "",
  shoulderCm: "",
  sleeveCm: "",
  waistCm: "",
  hipCm: "",
  riseCm: "",
  hemCm: "",
  bagWidthCm: "",
  bagHeightCm: "",
  bagDepthCm: "",
  favorite: false,
  memo: "",
  materialNote: "",
  repairNeeded: false,
  declutter: false,
  declutterMethod: DECLUTTER_METHODS[0],
  deleted: false,
  deletedAt: null,
  soldPrice: null,
  soldDate: null,
  ...over,
});

export const initialItems: ClothingItem[] = [
  seedItem({ seed: "a1", brandName: "LACOSTE", name: "피케 반팔 셔츠", category: "Shirt", seasons: ["여름"], price: 129000, purchasePrice: 89000, purchasePlace: "무신사", purchaseDate: "2024-05-11", materials: [{ name: "면", percent: 100 }], lengthCm: 72, chestCm: 54, shoulderCm: 46, sleeveCm: 22, favorite: true }),
  seedItem({ seed: "a2", brandName: "COS", name: "울 오버사이즈 코트", category: "Coat", seasons: ["겨울"], price: 390000, purchasePrice: 390000, purchasePlace: "COS 청담", purchaseDate: "2023-11-02", materials: [{ name: "울", percent: 90 }, { name: "캐시미어", percent: 10 }], lengthCm: 98, chestCm: 62, shoulderCm: 50, sleeveCm: 64, favorite: true }),
  seedItem({ seed: "a3", brandName: "ARKET", name: "코튼 니트 스웨터", category: "Knit", seasons: ["봄/가을"], price: 99000, purchasePrice: 79000, purchasePlace: "ARKET", purchaseDate: "2024-09-20", materials: [{ name: "면", percent: 100 }], lengthCm: 65, chestCm: 56, shoulderCm: 48, sleeveCm: 60 }),
  seedItem({ seed: "a4", brandName: "UNIQLO", name: "히트텍 크루넥", category: "Long Sleeve", seasons: ["겨울"], price: 19900, purchasePrice: 14900, purchasePlace: "유니클로", purchaseDate: "2023-12-01", materials: [{ name: "폴리에스터", percent: 89 }, { name: "폴리우레탄", percent: 11 }], lengthCm: 66, chestCm: 50, shoulderCm: 44, sleeveCm: 58 }),
  seedItem({ seed: "a5", brandName: "Acne Studios", name: "데님 와이드 팬츠", category: "Pants", seasons: ["여름", "봄/가을", "겨울"], price: 320000, purchasePrice: 250000, purchasePlace: "무신사", purchaseDate: "2024-02-14", materials: [{ name: "면", percent: 98 }, { name: "폴리우레탄", percent: 2 }], lengthCm: 108, favorite: true }),
];
