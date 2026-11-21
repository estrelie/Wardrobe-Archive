// --- src/types/material.ts ---
export interface Material {
  name: string;
  percent: number | "";
}

export interface MaterialLibraryItem {
  id: string;
  name: string;
  aliases: string[];
}
