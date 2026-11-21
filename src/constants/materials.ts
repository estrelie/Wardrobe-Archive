import type { MaterialLibraryItem } from "../types/material";

/* ---------------------------------------------------------
   Material Library Seed
--------------------------------------------------------- */
export const INITIAL_MATERIALS_LIBRARY: MaterialLibraryItem[] = [
  { id: crypto.randomUUID(), name: "면", aliases: ["cotton", "코튼"] },
  { id: crypto.randomUUID(), name: "울", aliases: ["wool", "모"] },
  { id: crypto.randomUUID(), name: "캐시미어", aliases: ["cashmere"] },
  { id: crypto.randomUUID(), name: "린넨", aliases: ["linen", "리넨", "마"] },
  { id: crypto.randomUUID(), name: "폴리에스터", aliases: ["polyester", "폴리", "poly"] },
  { id: crypto.randomUUID(), name: "폴리우레탄", aliases: ["polyurethane", "스판", "엘라스탄", "elastane", "spandex", "스판덱스"] },
  { id: crypto.randomUUID(), name: "레이온", aliases: ["rayon"] },
  { id: crypto.randomUUID(), name: "실크", aliases: ["silk", "견"] },
  { id: crypto.randomUUID(), name: "나일론", aliases: ["nylon"] },
  { id: crypto.randomUUID(), name: "알파카", aliases: ["alpaca"] },
  { id: crypto.randomUUID(), name: "모헤어", aliases: ["mohair"] },
  { id: crypto.randomUUID(), name: "앙고라", aliases: ["angora"] },
  { id: crypto.randomUUID(), name: "아크릴", aliases: ["acrylic"] },
  { id: crypto.randomUUID(), name: "텐셀", aliases: ["tencel", "리오셀", "lyocell"] },
  { id: crypto.randomUUID(), name: "비스코스", aliases: ["viscose"] },
  { id: crypto.randomUUID(), name: "가죽", aliases: ["leather", "레더"] },
  { id: crypto.randomUUID(), name: "스웨이드", aliases: ["suede"] },
  { id: crypto.randomUUID(), name: "데님", aliases: ["denim", "청"] },
];
