import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, Rows3, Plus, X,
  Heart, Trash2, BarChart3, Shirt, Tag, Command, Image as ImageIcon,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Square, Calendar as CalendarIcon, Database
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* =========================================================
   TYPES SECTION
========================================================= */

// --- src/types/common.ts ---
export type Category =
  | "T-shirt"
  | "Long Sleeve"
  | "Shirt"
  | "Blouse"
  | "Knit"
  | "Sweatshirt"
  | "Hoodie"
  | "Sleeveless"
  | "Dress"
  | "Denim"
  | "Slacks"
  | "Pants"
  | "Shorts"
  | "Skirt"
  | "Jacket"
  | "Coat"
  | "Padding"
  | "Shoes"
  | "Bag"
  | "Accessories";
export type CategoryGroup =
  | "Tops"
  | "Dress"
  | "Bottoms"
  | "Outerwear"
  | "Others";
export type Season = "여름" | "봄/가을" | "겨울";
export type DeclutterMethod = "중고 거래" | "처분";
export type BrandTier = "헤리티지" | "디자이너" | "컨템포러리" | "SPA" | "영캐주얼" | "보세" | "스포츠" | "아웃도어";
export type PageType = "wardrobe" | "brands" | "stats" | "calendar" | "trash";
export type ViewMode = "gallery" | "table";
export type DeletionReason = "판매" | "기부" | "폐기" | "기타";

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

// --- src/types/reference.ts ---
export interface ReferenceImage {
  id: string;
  itemId: string;
  image: string;
  memo: string;
  order: number;
  createdAt: number;
}

// --- src/types/brand.ts ---
export interface Brand {
  id: string;
  name: string;
  tier: BrandTier | string;
  logo: string;
  memo: string;
  favorite: boolean;
  color: string;
}

export interface BrandWithStats extends Brand {
  items: ClothingItem[];
  total: number;
  latestAddedAt: number;
}

// --- src/types/clothing.ts ---
export interface ClothingItem {
  id: string;
  images: string[];
  brandId: string;
  brandName: string;
  name: string;
  category: Category | string;
  seasons: Season[];
  price: number | "";
  purchasePrice: number | "";
  purchasePlace: string;
  purchaseDate: string;
  addedAt: number;
  size: string;
  materials: Material[];
  lengthCm: number | string;
  chestCm: number | string;
  shoulderCm: number | string;
  sleeveCm: number | string;
  waistCm: number | string;
  hipCm: number | string;
  riseCm: number | string;
  hemCm: number | string;
  bagWidthCm: number | string;
  bagHeightCm: number | string;
  bagDepthCm: number | string;
  favorite: boolean;
  memo: string;
  repairNeeded: boolean;
  declutter: boolean;
  declutterMethod: DeclutterMethod | string;
  deleted?: boolean;
  deletedAt?: string | null;
  deletionReason?: DeletionReason | string | null;
  soldPrice?: number | "" | null;
  soldDate?: string | null;
  brandInfo?: Brand;
}

export interface ClothingDraft extends ClothingItem {
  _newBrandTier?: BrandTier | string;
  _newBrandLogo?: string;
}

// --- src/types/sale.ts ---
export interface SaleRecord {
  id: string;
  itemId: string;
  brandName: string;
  name: string;
  soldPrice: number;
  soldDate: string;
  createdAt: number;
}

export interface ArchiveSettings {
  gallerySize: number;
  autoDeleteDays: number | null;
}

export interface ArchiveData {
  version: number;
  exportedAt: string;
  items: ClothingItem[];
  brands: Brand[];
  materials: MaterialLibraryItem[];
  references: ReferenceImage[];
  sales: SaleRecord[];
  settings: ArchiveSettings;
}

/* ---------------------------------------------------------
   Design tokens & Constants
--------------------------------------------------------- */
const COLOR = {
  bg: "#FFFFFF",
  bg2: "#FAFAF8",
  border: "#E8E8E8",
  text: "#111111",
  subtext: "#777777",
};

const GRAYS: string[] = ["#111111", "#3D3D3D", "#6B6B6B", "#8F8F8F", "#B3B3B3", "#D6D6D6"];
const CATEGORIES: Category[] = [
  "T-shirt",
  "Long Sleeve",
  "Shirt",
  "Blouse",
  "Knit",
  "Sweatshirt",
  "Hoodie",
  "Sleeveless",

  "Dress",

  "Denim",
  "Slacks",
  "Pants",
  "Shorts",
  "Skirt",

  "Jacket",
  "Coat",
  "Padding",

  "Shoes",
  "Bag",
  "Accessories",];
const CATEGORY_GROUPS: Record<CategoryGroup, Category[]> = {
  Tops: [
    "T-shirt",
    "Long Sleeve",
    "Shirt",
    "Blouse",
    "Knit",
    "Sweatshirt",
    "Hoodie",
    "Sleeveless",
  ],
  Dress: [
    "Dress",
  ],
  Bottoms: [
    "Denim",
    "Slacks",
    "Pants",
    "Shorts",
    "Skirt",
  ],
  Outerwear: [
    "Jacket",
    "Coat",
    "Padding",
  ],
  Others: [
    "Shoes",
    "Bag",
    "Accessories",
  ],
};
const SEASONS: Season[] = ["여름", "봄/가을", "겨울"];
const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "FREE",];
const DECLUTTER_METHODS: DeclutterMethod[] = ["중고 거래", "처분"];
const BRAND_TIERS: BrandTier[] = ["헤리티지", "디자이너", "컨템포러리", "SPA", "영캐주얼", "보세", "스포츠", "아웃도어"];

/* ---------------------------------------------------------
   Material Library Seed
--------------------------------------------------------- */
const INITIAL_MATERIALS_LIBRARY: MaterialLibraryItem[] = [
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

/* ---------------------------------------------------------
   Category-aware detailed sizing
--------------------------------------------------------- */
type SizeFieldKey = keyof ClothingItem;
interface SizeField { key: SizeFieldKey; label: string; }

const SIZE_FIELD_SETS: Record<string, SizeField[]> = {
  top: [
    { key: "lengthCm", label: "총장" },
    { key: "chestCm", label: "가슴단면" },
    { key: "shoulderCm", label: "어깨" },
    { key: "sleeveCm", label: "소매" },
  ],
  outer: [
    { key: "lengthCm", label: "총장" },
    { key: "chestCm", label: "가슴단면" },
    { key: "shoulderCm", label: "어깨" },
    { key: "sleeveCm", label: "소매" },
  ],
  bottom: [
    { key: "waistCm", label: "허리" },
    { key: "hipCm", label: "힙" },
    { key: "riseCm", label: "밑위" },
    { key: "hemCm", label: "밑단" },
    { key: "lengthCm", label: "총장" },
  ],
  bag: [
    { key: "bagWidthCm", label: "가로" },
    { key: "bagHeightCm", label: "세로" },
    { key: "bagDepthCm", label: "폭" },
  ],
};

const CATEGORY_SIZE_TYPE: Record<string, string> = {
  // Tops
  "T-shirt": "top",
  "Long Sleeve": "top",
  "Shirt": "top",
  "Blouse": "top",
  "Knit": "top",
  "Sweatshirt": "top",
  "Hoodie": "top",
  "Sleeveless": "top",

  // Dress
  "Dress": "top",

  // Bottoms
  "Denim": "bottom",
  "Slacks": "bottom",
  "Pants": "bottom",
  "Shorts": "bottom",
  "Skirt": "bottom",

  // Outerwear
  "Jacket": "outer",
  "Coat": "outer",
  "Padding": "outer",

  // Others
  "Shoes": "none",
  "Bag": "bag",
  "Accessories": "none",
};

function getSizeFields(category: string): SizeField[] | null {
  const type = CATEGORY_SIZE_TYPE[category] ?? "top";
  if (type === "none") return null;
  return SIZE_FIELD_SETS[type] || null;
}

/* ---------------------------------------------------------
   Local storage helpers
--------------------------------------------------------- */
declare global {
  interface Window {
    storage?: {
      get: (key: string, parse?: boolean) => Promise<{ value: string } | null>;
      set: (key: string, value: string, stringify?: boolean) => Promise<void>;
      delete: (key: string, parse?: boolean) => Promise<void>;
      list: (prefix: string, parse?: boolean) => Promise<{ keys: string[] } | null>;
    };
  }
}

async function storeGet(key: string): Promise<string |null> {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("storage get failed", key, e);
    return null;
  }
}

async function storeSet(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}

async function storeDelete(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("storage delete failed", key, e);
  }
}

async function storeListLoad<T>(prefix: string): Promise<T[]> {
  try {
    const result: T[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith(prefix)) continue;

      const value = localStorage.getItem(key);

      if (!value) continue;

      try {
        result.push(JSON.parse(value) as T);
      } catch {
        // 손상된 데이터는 건너뜀
      }
    }

    return result;
  } catch (e) {
    console.error("storage list failed", e);
    return [];
  }
}

/* ---------------------------------------------------------
   Image compression
--------------------------------------------------------- */
function fileToCompressedDataUrl(file: File, maxDim: number = 1000, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------
   Seed data
--------------------------------------------------------- */
const seedItem = (over: Partial<ClothingItem> & { seed?: string }): ClothingItem => ({
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
  repairNeeded: false,
  declutter: false,
  declutterMethod: DECLUTTER_METHODS[0],
  deleted: false,
  deletedAt: null,
  deletionReason: null,
  soldPrice: null,
  soldDate: null,
  ...over,
});

const initialItems: ClothingItem[] = [
  seedItem({ seed: "a1", brandName: "LACOSTE", name: "피케 반팔 셔츠", category: "Shirt", seasons: ["여름"], price: 129000, purchasePrice: 89000, purchasePlace: "무신사", purchaseDate: "2024-05-11", materials: [{ name: "면", percent: 100 }], lengthCm: 72, chestCm: 54, shoulderCm: 46, sleeveCm: 22, favorite: true }),
  seedItem({ seed: "a2", brandName: "COS", name: "울 오버사이즈 코트", category: "Coat", seasons: ["겨울"], price: 390000, purchasePrice: 390000, purchasePlace: "COS 청담", purchaseDate: "2023-11-02", materials: [{ name: "울", percent: 90 }, { name: "캐시미어", percent: 10 }], lengthCm: 98, chestCm: 62, shoulderCm: 50, sleeveCm: 64, favorite: true }),
  seedItem({ seed: "a3", brandName: "ARKET", name: "코튼 니트 스웨터", category: "Knit", seasons: ["봄/가을"], price: 99000, purchasePrice: 79000, purchasePlace: "ARKET", purchaseDate: "2024-09-20", materials: [{ name: "면", percent: 100 }], lengthCm: 65, chestCm: 56, shoulderCm: 48, sleeveCm: 60 }),
  seedItem({ seed: "a4", brandName: "UNIQLO", name: "히트텍 크루넥", category: "Long Sleeve", seasons: ["겨울"], price: 19900, purchasePrice: 14900, purchasePlace: "유니클로", purchaseDate: "2023-12-01", materials: [{ name: "폴리에스터", percent: 89 }, { name: "폴리우레탄", percent: 11 }], lengthCm: 66, chestCm: 50, shoulderCm: 44, sleeveCm: 58 }),
  seedItem({ seed: "a5", brandName: "Acne Studios", name: "데님 와이드 팬츠", category: "Pants", seasons: ["여름", "봄/가을", "겨울"], price: 320000, purchasePrice: 250000, purchasePlace: "무신사", purchaseDate: "2024-02-14", materials: [{ name: "면", percent: 98 }, { name: "폴리우레탄", percent: 2 }], lengthCm: 108, favorite: true }),
];

const fmtWon = (n: number | string) => `₩${Number(n || 0).toLocaleString("ko-KR")}`;

/* ---------------------------------------------------------
   useAutoSave Hook (with beforeunload & force unmount save)
--------------------------------------------------------- */
function useAutoSave<T>(
  originalData: T, 
  onSave: (dataToSave: T) => void, 
  delay: number = 700, 
  keyExtractor: (data: T) => string
) {
  const [draft, setDraft] = useState<T>(originalData);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const lastSavedData = useRef<T>(originalData);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const currentKey = keyExtractor(originalData);
  const prevKey = useRef(currentKey);

  useEffect(() => {
    if (currentKey !== prevKey.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setDraft(originalData);
      lastSavedData.current = originalData;
      setStatus("idle");
      prevKey.current = currentKey;
    }
  }, [currentKey, originalData]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(lastSavedData.current);
  }, [draft]);

  // Unsaved Protection: Window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, status]);

  const triggerSave = useCallback((dataToSave: T) => {
    setStatus("saving");
    onSaveRef.current(dataToSave);
    lastSavedData.current = dataToSave;
    setStatus("saved");

    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setStatus("idle"), 3000);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      triggerSave(draft);
      timeoutRef.current = null;
    }, delay);

    return () => {
      // Synchronous save on unmount if pending
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        triggerSave(draft);
        timeoutRef.current = null;
      }
    };
  }, [draft, isDirty, delay, triggerSave]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (JSON.stringify(draft) !== JSON.stringify(lastSavedData.current)) {
      triggerSave(draft);
    }
  }, [draft, triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

  return { draft, setDraft, status, forceSave };
}

/* ---------------------------------------------------------
   Building blocks
--------------------------------------------------------- */
interface IconBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}
function IconBtn({ children, onClick, active }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 11px", fontSize: 13, fontWeight: 500,
        color: active ? COLOR.text : COLOR.subtext,
        background: active ? COLOR.bg2 : "transparent",
        border: `1px solid ${active ? COLOR.border : "transparent"}`,
        borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = COLOR.bg2; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}
function ActiveChip({ label, onRemove, icon }: ActiveChipProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 29, gap: 8, padding: "0px 14px",
      background: COLOR.bg2, border: `1px solid ${COLOR.border}`, borderRadius: 20,
      fontSize: 12.5, color: COLOR.text, animation: "simpleFade 0.2s ease"
    }}>
      {icon}
      {label}
      <button onClick={onRemove} style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", padding: 0, cursor: "pointer", color: COLOR.subtext
      }}>
        <X size={11} />
      </button>
    </div>
  );
}

interface FieldProps {
  label: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
function Field({ label, style, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 6, letterSpacing: 0.2 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 10px",
  fontSize: 14, color: COLOR.text, background: COLOR.bg,
  border: `1px solid ${COLOR.border}`, borderRadius: 6, outline: "none",
  fontFamily: "inherit",
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
function TextInput(props: TextInputProps) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
function Select(props: SelectProps) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{props.children}</select>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, color: COLOR.subtext, letterSpacing: 0.4, margin: "22px 0 12px",
      paddingBottom: 8, borderBottom: `1px solid ${COLOR.border}`,
    }}>{children}</div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
        border: `1px solid ${COLOR.border}`,
        borderRadius: 6,
        padding: "14px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 10, textAlign: "center", }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, }}>
        <div style={{ fontSize: 15, fontWeight: 430, color: COLOR.text, }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11.5, color: COLOR.subtext, }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: COLOR.subtext }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center", color: COLOR.subtext, fontSize: 13.5, gridColumn: "1 / -1" }}>
      {text}
    </div>
  );
}

const addBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", fontSize: 13,
  border: `1px solid ${COLOR.border}`, borderRadius: 6, background: COLOR.bg, cursor: "pointer",
};

const chipBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
  border: `1px solid ${active ? COLOR.text : COLOR.border}`,
  background: active ? COLOR.text : COLOR.bg,
  color: active ? "#fff" : COLOR.text,
});

interface MediaTabsProps {
  active: string;
  onChange: (tab: string) => void;
}
function MediaTabs({ active, onChange }: MediaTabsProps) {
  return (
    <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${COLOR.border}`, marginBottom: 16 }}>
      {["Photos", "Reference"].map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab.toLowerCase())}
          style={{
            background: "none", border: "none", padding: "0 4px 8px", cursor: "pointer",
            fontSize: 13, fontWeight: active === tab.toLowerCase() ? 500 : 400,
            color: active === tab.toLowerCase() ? COLOR.text : COLOR.subtext,
            borderBottom: active === tab.toLowerCase() ? `2px solid ${COLOR.text}` : "2px solid transparent",
            marginBottom: "-1px",
            textTransform: "capitalize",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

interface SeasonPickerProps {
  value: Season[];
  onChange: (val: Season[]) => void;
}
function SeasonPicker({ value, onChange }: SeasonPickerProps) {
  const toggle = (s: Season) => {
    const set = new Set(value);
    set.has(s) ? set.delete(s) : set.add(s);
    onChange(Array.from(set));
  };
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 18, }}>
      {SEASONS.map((s) => (
        <button key={s} type="button" onClick={() => toggle(s)} style={{
          padding: "7px 12px", fontSize: 12.5, borderRadius: 6, cursor: "pointer",
          border: `1px solid ${value.includes(s) ? COLOR.text : COLOR.border}`,
          background: value.includes(s) ? COLOR.text : COLOR.bg,
          color: value.includes(s) ? "#fff" : COLOR.text,
        }}>
          {s}
        </button>
      ))}
    </div>
  );
}

interface BrandInputProps {
  value: string;
  onChange: (val: string) => void;
  brands: string[];
}
function BrandInput({ value, onChange, brands }: BrandInputProps) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = Array.from(new Set(brands.filter(Boolean)));
    const list = q ? pool.filter((b) => b.toLowerCase().includes(q) && b.toLowerCase() !== q) : pool;
    return list.slice(0, 6);
  }, [value, brands]);

  return (
    <div style={{ position: "relative" }}>
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder=""
      />
      {focused && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)", maxHeight: 180, overflowY: "auto",
        }}>
          {suggestions.map((b) => (
            <div key={b} onMouseDown={() => onChange(b)} style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLOR.bg2}
              onMouseLeave={(e) => e.currentTarget.style.background = COLOR.bg}>
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BrandLogoProps {
  src?: string;
  size?: number;
}
function BrandLogo({ src, size = 16 }: BrandLogoProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size, height: size, objectFit: "contain", borderRadius: 3,
        border: `1px solid ${COLOR.border}`, background: "#fff", flexShrink: 0,
      }}
    />
  );
}

interface BrandLogoPickerProps {
  value: string;
  onChange: (val: string) => void;
}
function BrandLogoPicker({ value, onChange }: BrandLogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 240, 0.9);
      onChange(dataUrl);
    } catch (err) {
      console.error("logo processing failed", err);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 38, height: 38, borderRadius: 6, border: `1px dashed ${COLOR.border}`,
          background: COLOR.bg2, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", overflow: "hidden",
        }}
      >
        {busy
          ? <span style={{ fontSize: 8.5, color: COLOR.subtext }}>...</span>
          : value
            ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <ImageIcon size={14} color={COLOR.subtext} />}
      </div>
      {value && !busy && (
        <button type="button" onClick={() => onChange("")} style={{
          position: "absolute", top: -6, right: -6, width: 15, height: 15, borderRadius: "50%",
          background: "#fff", border: `1px solid ${COLOR.border}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>
          <X size={9} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

interface FormBrandSectionProps {
  formBrandName: string;
  brands: Brand[];
  newTier: BrandTier | string;
  setNewTier: (val: BrandTier | string) => void;
  newLogo: string;
  setNewLogo: (val: string) => void;
}
function FormBrandSection({ formBrandName, brands, newTier, setNewTier, newLogo, setNewLogo }: FormBrandSectionProps) {
  const matchedBrand = brands.find(b => b.name === formBrandName);

  if (!formBrandName) return null;

  if (matchedBrand) {
    return null;
  }

  return (
    <div style={{ marginTop: 10, padding: 12, background: COLOR.bg2, borderRadius: 6, border: `1px dashed ${COLOR.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10, color: COLOR.text }}>Add New Brand ({formBrandName})</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <BrandLogoPicker value={newLogo} onChange={setNewLogo} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 4 }}>Tier (Required)</div>
          <Select value={newTier} onChange={e => setNewTier(e.target.value)}>
            {BRAND_TIERS.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}

interface MaterialsEditorProps {
  materials: Material[];
  onChange: (m: Material[]) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
function MaterialsEditor({ materials, onChange, materialLibrary, onAddMaterialToLibrary, materialFreq }: MaterialsEditorProps) {
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    let pool = [...materialLibrary].sort((a, b) => (materialFreq[b.name] || 0) - (materialFreq[a.name] || 0));
    
    if (q) {
      pool = pool.filter(m => m.name.toLowerCase().includes(q) || (m.aliases || []).some(a => a.toLowerCase().includes(q)));
    }
    return pool.slice(0, 8);
  }, [name, materialLibrary, materialFreq]);

  const add = (overrideName?: string) => {
    const inputStr = typeof overrideName === 'string' ? overrideName : name;
    const n = inputStr.trim();
    if (!n) return;
    
    const lower = n.toLowerCase();
    let resolvedName = n;
    const match = materialLibrary.find(m => m.name.toLowerCase() === lower || (m.aliases || []).some(a => a.toLowerCase() === lower));
    
    if (match) {
      resolvedName = match.name;
    } else {
      const newMat = { id: crypto.randomUUID(), name: n, aliases: [] };
      onAddMaterialToLibrary(newMat);
    }

    if (materials.some(m => m.name === resolvedName)) {
       setName("");
       setPercent("");
       return;
    }

    onChange([...materials, { name: resolvedName, percent: percent === "" ? "" : Number(percent) }]);
    setName(""); setPercent("");
  };

  const remove = (idx: number) => onChange(materials.filter((_, i) => i !== idx));
  const total = materials.reduce((s, m) => s + (Number(m.percent) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {materials.map((m, i) => (
          <span key={i} style={{
            fontSize: 12.5, padding: "5px 10px", borderRadius: 5, background: COLOR.bg2,
            border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", gap: 6,
          }}>
            {m.name} {m.percent !== "" ? `${m.percent}%` : ""}
            <X size={11} style={{ cursor: "pointer" }} onClick={() => remove(i)} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, position: "relative" }}>
        <div style={{ flex: 2, position: "relative" }}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Material (e.g. Cotton)" />
          
          {focused && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
              background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6,
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)", maxHeight: 180, overflowY: "auto",
            }}>
              {suggestions.map((b) => (
                <div key={b.id} 
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => { add(b.name); setFocused(false); }} 
                  style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLOR.bg2}
                  onMouseLeave={(e) => e.currentTarget.style.background = COLOR.bg}>
                  <span>{b.name}</span>
                  {materialFreq[b.name] > 0 && <span style={{ fontSize: 11, color: COLOR.subtext }}>{materialFreq[b.name]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <TextInput type="number" value={percent} onChange={(e) => setPercent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} placeholder="%" style={{ flex: 1 }} />
        <button type="button" onClick={() => add()} style={{ ...addBtnStyle, padding: "9px 12px" }}>Add</button>
      </div>
      {materials.length > 0 && total !== 100 && (
        <div style={{ fontSize: 11, color: "#B3542E", marginTop: 6 }}>
          Total {total}%
        </div>
      )}
    </div>
  );
}

interface SizeDetailBoxProps {
  category: string;
  draft: ClothingDraft;
  onChangeField: (k: keyof ClothingDraft, v: string) => void;
}
function SizeDetailBox({ category, draft, onChangeField }: SizeDetailBoxProps) {
  const rows = getSizeFields(category);
  if (!rows) return null;
  return (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 10 }}>Detailed Size</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.key}>
            <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 5 }}>{r.label}</div>
            <div style={{ position: "relative" }}>
              <TextInput type="number" value={draft[r.key] as string | number}
                onChange={(e) => onChangeField(r.key, e.target.value)}
                style={{ paddingRight: 32 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: COLOR.subtext }}>cm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Image Manager (Product Photos)
--------------------------------------------------------- */
interface ImageManagerProps {
  images: string[];
  onChange: (imgs: string[]) => void;
}
function ImageManager({ images, onChange }: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const compressed = await Promise.all(files.map((f) => fileToCompressedDataUrl(f)));
      onChange([...images, ...compressed]);
    } catch (err) {
      console.error("image processing failed", err);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  
  const setMain = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    onChange(next);
  };
  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    try {
      const compressed = await Promise.all(files.map((f) => fileToCompressedDataUrl(f)));
      onChange([...images, ...compressed]);
    } catch (err) {
      console.error("image processing failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div 
      className="fade-tab" 
      style={{ position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(250, 250, 248, 0.85)",
          border: `2px dashed ${COLOR.subtext}`,
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 500, color: COLOR.text
        }}>
          Drop images here
        </div>
      )}
      <div style={{
        width: "100%", aspectRatio: "4 / 5", background: COLOR.bg2, borderRadius: 6,
        overflow: "hidden", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {images[0]
          ? <img src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12.5, color: COLOR.subtext }}>{busy ? "..." : ""}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {images.map((src, idx) => (
          <div key={idx} style={{ position: "relative", width: 56, height: 70 }}>
            <img src={src} alt="" style={{
              width: "100%", height: "100%", objectFit: "cover", borderRadius: 4,
              border: idx === 0 ? `2px solid ${COLOR.text}` : `1px solid ${COLOR.border}`,
            }} />
            <button type="button" onClick={() => remove(idx)} style={{
              position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%",
              background: "#fff", border: `1px solid ${COLOR.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}>
              <X size={9} />
            </button>
            {idx !== 0 && (
              <button type="button" onClick={() => setMain(idx)} style={{
                position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                fontSize: 8.5, background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 3,
                padding: "1px 4px", cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Main
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} style={{
          width: 56, height: 70, border: `1px dashed ${COLOR.border}`, borderRadius: 4,
          background: COLOR.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Plus size={16} color={COLOR.subtext} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Reference Board Components (Mood Board with dnd-kit)
--------------------------------------------------------- */
interface ImageViewerProps {
  images: ReferenceImage[];
  initialIndex: number;
  onClose: () => void;
}
function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(i - 1, 0));
      else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(i + 1, images.length - 1));
      else if (e.key === "Home") setCurrentIndex(0);
      else if (e.key === "End") setCurrentIndex(images.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, images.length]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => Math.max(i - 1, 0)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => Math.min(i + 1, images.length - 1)); };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(z => {
      const newZoom = Math.max(0.5, Math.min(z + zoomDelta, 5));
      if (newZoom <= 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      hasDragged.current = false;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      hasDragged.current = true;
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const handleContainerClick = () => {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(17,17,17,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center", animation: "simpleFade 0.2s ease"
    }}>
      <div style={{ position: "absolute", top: 20, right: 24, display: "flex", alignItems: "center", gap: 20, zIndex: 10000 }}>
        <div style={{ color: "#fff", fontSize: 13, letterSpacing: 1, opacity: 0.9, fontWeight: 500 }}>
          {currentIndex + 1} / {images.length}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ZoomIn color="#fff" size={24} opacity={0.9} />
          </button>
          <button onClick={() => {
            setZoom(z => {
              const n = Math.max(z - 0.5, 0.5);
              if (n <= 1) setPan({x: 0, y: 0});
              return n;
            });
          }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ZoomOut color="#fff" size={24} opacity={0.9} />
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8, display: "flex", alignItems: "center" }}>
            <X color="#fff" size={28} opacity={0.9} />
          </button>
        </div>
      </div>
      
      {currentIndex > 0 && (
        <button onClick={prev} style={{ position: "absolute", left: 24, background: "none", border: "none", cursor: "pointer", zIndex: 10000, display: "flex", alignItems: "center" }}>
          <ChevronLeft color="#fff" size={40} opacity={0.9} />
        </button>
      )}
      
      {currentIndex < images.length - 1 && (
        <button onClick={next} style={{ position: "absolute", right: 24, background: "none", border: "none", cursor: "pointer", zIndex: 10000, display: "flex", alignItems: "center" }}>
          <ChevronRight color="#fff" size={40} opacity={0.9} />
        </button>
      )}

      <div 
        style={{ 
          width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default"
        }} 
        onClick={handleContainerClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          key={images[currentIndex].id}
          src={images[currentIndex].image}
          alt=""
          onClick={e => {
            if (hasDragged.current) {
              hasDragged.current = false;
              e.stopPropagation();
              return;
            }
            e.stopPropagation();
          }}
          onDoubleClick={handleDoubleClick}
          onDragStart={e => e.preventDefault()}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
            maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            animation: "simpleFade 0.3s ease"
          }}
        />
      </div>
    </div>
  );
}

interface ReferenceCardProps {
  refItem: ReferenceImage;
  index: number;
  updateMemo: (id: string, memo: string) => void;
  remove: (id: string) => void;
  onClick: (index: number) => void;
  setNodeRef?: (node: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
}
const ReferenceCard = React.memo(({ refItem, index, updateMemo, remove, onClick, setNodeRef, attributes, listeners, style, isDragging, isOverlay }: ReferenceCardProps) => {
  const [hover, setHover] = useState(false);
  const [localMemo, setLocalMemo] = useState(refItem.memo || "");

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        breakInside: "avoid", marginBottom: 16, position: "relative",
        borderRadius: 8, transition: style?.transition || "all 0.2s ease", paddingBottom: 2,
        opacity: isDragging ? 0.3 : 1,
        cursor: isOverlay ? "grabbing" : "grab",
        transform: isOverlay ? "scale(1.02)" : style?.transform,
        boxShadow: isOverlay ? "0 24px 64px rgba(0,0,0,0.15)" : "none",
        zIndex: isOverlay ? 999 : "auto"
      }}
      onMouseEnter={() => !isDragging && !isOverlay && setHover(true)}
      onMouseLeave={() => { setHover(false); updateMemo(refItem.id, localMemo); }}
      {...attributes}
      {...listeners}
    >
      <div style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>
        <img 
          src={refItem.image} 
          onClick={() => onClick(index)} 
          alt=""
          style={{ width: "100%", display: "block", cursor: "zoom-in", transition: "transform 0.2s ease", transform: hover && !isDragging && !isOverlay ? "scale(1.01)" : "scale(1)" }} 
        />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); remove(refItem.id); }}
          style={{
            position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hover && !isDragging && !isOverlay ? 1 : 0, transition: "opacity 0.2s"
          }}
        >
          <X size={12} color={COLOR.text} />
        </button>
      </div>
      
      {(hover || localMemo || isOverlay) && (
        <div style={{ marginTop: 6, padding: "0 2px" }}>
          {hover && !isDragging && !isOverlay ? (
            <input
              onPointerDown={(e) => e.stopPropagation()}
              value={localMemo}
              onChange={(e) => setLocalMemo(e.target.value)}
              onBlur={() => updateMemo(refItem.id, localMemo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateMemo(refItem.id, localMemo);
                e.stopPropagation();
              }}
              placeholder="Add memo..."
              style={{
                width: "100%", fontSize: 11.5, border: "none", background: "transparent",
                color: COLOR.text, outline: "none", padding: "4px 2px",
                borderBottom: `1px solid ${COLOR.border}`, transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderBottomColor = COLOR.text}
            />
          ) : (
            <div style={{ fontSize: 11.5, color: COLOR.subtext, padding: "5px 2px", minHeight: 24, wordBreak: "break-word" }}>
              {localMemo}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

interface SortableReferenceCardProps extends ReferenceCardProps {}
const SortableReferenceCard = React.memo((props: SortableReferenceCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.refItem.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ReferenceCard
      {...props}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      style={style}
      isDragging={isDragging}
    />
  );
});

interface ReferenceManagerProps {
  itemId: string;
}
const ReferenceManager = React.memo(({ itemId }: ReferenceManagerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const lastSavedData = useRef("[]");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    (async () => {
      const all = await storeListLoad<ReferenceImage>("reference:");
      const filtered = all.filter(r => r.itemId === itemId).sort((a,b) => a.order - b.order);
      setReferences(filtered);
      lastSavedData.current = JSON.stringify(filtered);
      setLoading(false);
    })();
  }, [itemId]);

  const isDirty = useMemo(() => JSON.stringify(references) !== lastSavedData.current, [references]);

  // Unsaved Protection: Window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (loading) return;
    const currentString = JSON.stringify(references);
    if (currentString !== lastSavedData.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        for (const r of references) {
          await storeSet(`reference:${r.id}`, JSON.stringify(r));
        }
        lastSavedData.current = currentString;
        timeoutRef.current = null;
      }, 700);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        references.forEach(r => storeSet(`reference:${r.id}`, JSON.stringify(r)));
        timeoutRef.current = null;
      }
    };
  }, [references, loading]);

  const createRefs = async (files: File[]) => {
    const compressed = await Promise.all(files.map((f) => fileToCompressedDataUrl(f, 1000, 0.8)));
    return compressed.map((image, idx) => ({
      id: crypto.randomUUID(),
      itemId,
      image,
      memo: "",
      order: references.length + idx,
      createdAt: Date.now()
    }));
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        try {
          const newRefs = await createRefs(files);
          setReferences(prev => [...prev, ...newRefs].map((r, i) => ({ ...r, order: i })));
        } catch (err) {}
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [references.length, itemId]); 

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const newRefs = await createRefs(files);
      setReferences(prev => [...prev, ...newRefs].map((r, i) => ({ ...r, order: i })));
    } catch (err) {}
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleContainerDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      try {
        const newRefs = await createRefs(files);
        setReferences(prev => [...prev, ...newRefs].map((r, i) => ({ ...r, order: i })));
      } catch(err) {}
    }
  };

  const updateMemo = useCallback((id: string, memo: string) => {
    setReferences(prev => prev.map(r => r.id === id ? { ...r, memo } : r));
  }, []);

  const remove = useCallback(async (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, order: i })));
    await storeDelete(`reference:${id}`);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReferences((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((r, i) => ({ ...r, order: i }));
      });
    }
    setActiveId(null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  if (loading) {
    return <div style={{ fontSize: 13, color: COLOR.subtext, padding: 20 }}>...</div>;
  }

  const activeRefItem = references.find(r => r.id === activeId);

  return (
    <div 
      className="fade-tab"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleContainerDrop}
      style={{ minHeight: 200, position: "relative" }}
    >
      {dragActive && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1000,
          background: "rgba(250, 250, 248, 0.85)",
          border: `2px dashed ${COLOR.subtext}`,
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 500, color: COLOR.text
        }}>
          Drop images here
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div style={{ columnCount: 2, columnGap: 16 }}>
          <SortableContext items={references.map(r => r.id)} strategy={rectSortingStrategy}>
            {references.map((ref, idx) => (
              <SortableReferenceCard 
                key={ref.id} 
                refItem={ref} 
                index={idx} 
                updateMemo={updateMemo} 
                remove={remove} 
                onClick={setViewerIndex} 
              />
            ))}
          </SortableContext>
          {/* Placeholder Add Card */}
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              breakInside: "avoid", marginBottom: 16, cursor: "pointer",
              height: 120, background: COLOR.bg2, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px dashed ${COLOR.border}`, transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = COLOR.border; e.currentTarget.style.borderColor = COLOR.subtext; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLOR.bg2; e.currentTarget.style.borderColor = COLOR.border; }}
          >
            <ImageIcon size={20} color={COLOR.subtext} />
          </div>
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
          {activeId && activeRefItem ? (
            <ReferenceCard
              refItem={activeRefItem}
              index={references.findIndex(r => r.id === activeId)}
              updateMemo={updateMemo}
              remove={remove}
              onClick={setViewerIndex}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      
      {viewerIndex !== null && (
        <ImageViewer 
          images={references} 
          initialIndex={viewerIndex} 
          onClose={() => setViewerIndex(null)} 
        />
      )}
    </div>
  );
});

/* ---------------------------------------------------------
   New Minimal Filter Panel (Popover)
--------------------------------------------------------- */
interface FilterState {
  category: Category[];
  season: Season[];
  brands: string[];
  favoriteOnly: boolean;
}

interface FilterPopoverProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableBrands: Brand[];
}
function FilterPopover({ filters, setFilters, availableBrands }: FilterPopoverProps) {
  const toggle = <K extends keyof FilterState>(key: K, val: any) => {
    setFilters((f) => {
      const set = new Set<any>(f[key] as any);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...f, [key]: Array.from(set) };
    });
  };

  const Group = ({ title, options, filterKey }: { title: string, options: any[], filterKey: keyof FilterState }) => {
    if (!options || options.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: COLOR.text, fontWeight: 500, marginBottom: 10 }}>{title}</div>
        <div style={{ 
          display: "flex", flexWrap: "wrap", gap: 6, 
          maxHeight: filterKey === 'brands' ? 140 : 'auto', 
          overflowY: filterKey === 'brands' ? 'auto' : 'visible',
          paddingBottom: 4
        }}>
          {options.map((opt) => {
            const toggleVal = filterKey === 'brands' ? opt.id : opt;
            const displayLabel = filterKey === 'brands' ? opt.name : opt;
            const active = (filters[filterKey] as any[]).includes(toggleVal);
            return (
              <button key={toggleVal} onClick={() => toggle(filterKey, toggleVal)} style={{
                padding: "6px 12px", fontSize: 12, borderRadius: 20, cursor: "pointer",
                border: `1px solid ${active ? COLOR.text : COLOR.border}`,
                background: active ? COLOR.text : COLOR.bg,
                color: active ? "#fff" : COLOR.text,
                transition: "all 0.15s ease"
              }}>
                {displayLabel}
              </button>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: "absolute", top: 40, left: 0, zIndex: 30, width: 340,
      background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 10,
      padding: 20, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", cursor: "default"
    }}>
      <Group title="Category" options={CATEGORIES} filterKey="category" />
      <Group title="Season" options={SEASONS} filterKey="season" />
      <Group title="Brand" options={availableBrands} filterKey="brands" />
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLOR.border}` }}>
        <label onClick={() => setFilters((f) => ({ ...f, favoriteOnly: !f.favoriteOnly, }))  
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    cursor: "pointer",
    color: COLOR.text,
  }}
>
          <div style={{
            width: 34, height: 20, borderRadius: 12, background: filters.favoriteOnly ? COLOR.text : COLOR.border,
            position: "relative", transition: "background 0.2s"
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2, left: filters.favoriteOnly ? 16 : 2, transition: "left 0.2s, transform 0.2s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }} />
          </div>
          Favorite
        </label>
        <button 
          onClick={() => setFilters({ category: [], season: [], brands: [], favoriteOnly: false })}
          style={{ fontSize: 12, color: COLOR.subtext, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

interface SortField {
  key: string;
  label: string;
}

const CLOTHING_SORT_FIELDS: SortField[] = [
  { key: "addedAt", label: "Date Added" }, 
  { key: "brandName", label: "Brand" },
  { key: "seasons", label: "Season" },
  { key: "purchaseDate", label: "Purchase Date" },
  { key: "price", label: "Price" },
];

const BRAND_SORT_FIELDS: SortField[] = [
  { key: "itemsCount", label: "Item Count" },
  { key: "totalSpending", label: "Total Spending" },
  { key: "name", label: "Alphabetical" },
  { key: "favorite", label: "Favorites" }
];

interface SortPanelProps {
  sorts: SortState[];
  setSorts: React.Dispatch<React.SetStateAction<SortState[]>>;
  fields: SortField[];
  defaultKey: string;
}
function SortPanel({ sorts, setSorts, fields, defaultKey }: SortPanelProps) {
  const addSort = () => setSorts((s) => [...s, { key: defaultKey, dir: "desc" }]);
  const update = (i: number, patch: Partial<SortState>) => setSorts((s) => s.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const remove = (i: number) => setSorts((s) => s.filter((_, idx) => idx !== i));
  return (
    <div style={{
      position: "absolute", top: 40, right: 0, zIndex: 20, width: 280,
      background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 8,
      padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 11 }}>Sort</div>
      {sorts.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 8, alignItems: "center" }}>
          <Select value={s.key} onChange={(e) => update(i, { key: e.target.value })} style={{ flex: 1, padding: "6px 8px", fontSize: 12.5 }}>
            {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </Select>
          <button 
            onClick={() => update(i, { dir: s.dir === "asc" ? "desc" : "asc" })}
            style={{ minWidth: 60, height: 32, border: `1px solid ${COLOR.border}`, borderRadius: 5, background: COLOR.bg, color: COLOR.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, flexShrink: 0, }}>
            {s.dir === "asc" ? "Asc" : "Desc"}
          </button>
          <button 
            onClick={() => remove(i)} 
            style={{ width: 25, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: COLOR.subtext, flexShrink: 0, }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button onClick={addSort} style={{
        marginTop: 4, fontSize: 12.5, color: COLOR.text, background: "none",
        border: `1px dashed ${COLOR.border}`, borderRadius: 6, padding: "7px 10px", cursor: "pointer", width: "100%",
      }}>
        +
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Gallery card
--------------------------------------------------------- */
interface ClothingCardProps {
  item: ClothingItem;
  onOpen?: (item: ClothingItem) => void;
  onToggleFavorite?: (id: string) => void;
  accentColor?: string;
}
function ClothingCard({ item, onOpen, onToggleFavorite, accentColor }: ClothingCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => onOpen && onOpen(item)} style={{ cursor: "pointer", position: "relative" }}>
      
      {/* Optional Brand Hover Accent */}
      {accentColor && (
        <div style={{ 
          position: "absolute", left: -8, top: 8, bottom: 8, width: 3, 
          background: accentColor, borderRadius: 2, 
          opacity: hover ? 1 : 0, transition: "opacity 0.2s ease", zIndex: 10 
        }} />
      )}

      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", background: COLOR.bg2, borderRadius: 4 }}>
        {item.images[0]
          ? <img src={item.images[0]} alt={item.name} style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hover ? "scale(1.035)" : "scale(1)", transition: "transform 0.5s ease",
            }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: COLOR.subtext }}></div>}
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(item.id); }} style={{
          position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.85)",
          border: "none", borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          zIndex: 10
        }}>
          <Heart size={14} color={COLOR.text} fill={item.favorite ? COLOR.text : "none"} strokeWidth={1.6} />
        </button>
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0))",
          padding: "20px 10px 10px", opacity: hover ? 1 : 0, transition: "opacity 0.25s ease",
        }}>
          <div style={{ color: "#fff", fontSize: 11.5 }}>
            {item.category}{item.seasons.length ? ` · ${item.seasons.join(" · ")}` : ""}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <BrandLogo src={item.brandInfo?.logo} size={13} />
          <span style={{ fontSize: 11, color: COLOR.subtext, letterSpacing: 0.4, textTransform: "uppercase" }}>{item.brandName}</span>
        </div>
        <div style={{ fontSize: 14, color: COLOR.text, marginTop: 2 }}>{item.name}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Table view
--------------------------------------------------------- */
interface TableViewProps {
  items: ClothingItem[];
  onOpen: (item: ClothingItem) => void;
}
function TableView({ items, onOpen }: TableViewProps) {
  const cols = ["Brand", "Name", "Category", "Season", "Price", "Purchase Date"];
  return (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 6, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: COLOR.bg2 }}>
            {cols.map((c) => (
              <th key={c} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 500, color: COLOR.subtext, fontSize: 12, borderBottom: `1px solid ${COLOR.border}` }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} onClick={() => onOpen(it)} style={{ cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLOR.bg2}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}` }}>{it.brandName}</td>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}` }}>{it.name}</td>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}`, color: COLOR.subtext }}>{it.category}</td>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}`, color: COLOR.subtext }}>{it.seasons.join(", ")}</td>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}` }}>{fmtWon(it.price)}</td>
              <td style={{ padding: "10px 14px", borderBottom: `1px solid ${COLOR.border}`, color: COLOR.subtext }}>{it.purchaseDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------
   Clothing Detail Drawer (Auto-save)
--------------------------------------------------------- */
interface DrawerProps {
  item: ClothingItem;
  onClose: () => void;
  onSave: (item: ClothingItem) => void;
  onDelete: (id: string, reason?: string, price?: number | "", date?: string) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
function Drawer({ item, onClose, onSave, onDelete, brands, onAddBrand, materialLibrary, onAddMaterialToLibrary, materialFreq }: DrawerProps) {
  const [mediaTab, setMediaTab] = useState("photos");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [delReason, setDelReason] = useState<DeletionReason | string>("판매");
  const [soldPrice, setSoldPrice] = useState<number | "">("");
  const [soldDate, setSoldDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDelReason("판매");
    setSoldPrice("");
    setSoldDate(new Date().toISOString().split('T')[0]);
  }, [item.id]);

  const { draft, setDraft, status, forceSave } = useAutoSave<ClothingDraft>(
    { ...item, _newBrandTier: BRAND_TIERS[5], _newBrandLogo: "" },
    (dataToSave) => {
      let targetBrandId = dataToSave.brandId;
      const matchedBrand = brands.find(b => b.name === dataToSave.brandName);
      
      if (dataToSave.brandName) {
        if (matchedBrand) {
          targetBrandId = matchedBrand.id;
        } else {
          targetBrandId = crypto.randomUUID();
          onAddBrand({
            id: targetBrandId,
            name: dataToSave.brandName,
            tier: dataToSave._newBrandTier || BRAND_TIERS[5],
            logo: dataToSave._newBrandLogo || "",
            memo: "",
            favorite: false,
            color: "#B8B8B8"
          });
        }
      } else {
        targetBrandId = "";
      }

      const toSave: Partial<ClothingDraft> = { ...dataToSave, brandId: targetBrandId };
      delete toSave.brandInfo; 
      delete toSave._newBrandTier;
      delete toSave._newBrandLogo;
      onSave(toSave as ClothingItem);
    },
    700,
    (i) => i.id
  );

  const handleClose = useCallback(() => {
    forceSave();
    onClose();
  }, [forceSave, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  if (!item) return null;
  
  const set = (k: keyof ClothingDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const setBool = (k: keyof ClothingDraft) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.checked }));
  const setField = (k: keyof ClothingDraft, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.28)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw",
        background: COLOR.bg, borderLeft: `1px solid ${COLOR.border}`, zIndex: 41,
        overflowY: "auto", padding: "22px 24px 40px", boxShadow: "-12px 0 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 11, color: COLOR.subtext, letterSpacing: 1 }}>DETAIL</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {status === "saving" && <span style={{ fontSize: 11, color: COLOR.subtext }}>Saving...</span>}
            {status === "saved" && <span style={{ fontSize: 11, color: COLOR.subtext }}>Saved</span>}
            <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <X size={18} color={COLOR.subtext} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 32, minHeight: 200 }}>
          <MediaTabs active={mediaTab} onChange={setMediaTab} />
          {mediaTab === "photos" && (
            <ImageManager images={draft.images} onChange={(imgs) => setField("images", imgs)} />
          )}
          {mediaTab === "reference" && (
            <ReferenceManager itemId={draft.id} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "18px 0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <BrandLogo src={draft.brandInfo?.logo} size={19} />
              <div style={{ fontSize: 20, fontWeight: 500, color: COLOR.text }}>{draft.brandName || ""}</div>
            </div>
            <div style={{ fontSize: 14, color: COLOR.subtext, marginTop: 2 }}>{draft.name || ""}</div>
          </div>
          <button onClick={() => setDraft((d) => ({ ...d, favorite: !d.favorite }))} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Heart size={20} color={COLOR.text} fill={draft.favorite ? COLOR.text : "none"} strokeWidth={1.6} />
          </button>
        </div>

        <SectionTitle>Basic Info</SectionTitle>
        <Field label="Brand">
          <BrandInput value={draft.brandName} onChange={(v) => setField("brandName", v)} brands={brands.map(b => b.name)} />
          <FormBrandSection 
            formBrandName={draft.brandName} brands={brands} 
            newTier={draft._newBrandTier || ""} setNewTier={(v) => setField("_newBrandTier", v)} 
            newLogo={draft._newBrandLogo || ""} setNewLogo={(v) => setField("_newBrandLogo", v)} 
          />
        </Field>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Product Name"><TextInput value={draft.name} onChange={set("name")} /></Field>
          <Field label="Category">
            <Select value={draft.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field label="Season" style={{ gridColumn: "1 / -1" }}>
            <SeasonPicker value={draft.seasons} onChange={(v) => setField("seasons", v)} />
          </Field>
        </div>

        <SectionTitle>Purchase Info</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Retail Price"><TextInput type="number" value={draft.price} onChange={set("price")} /></Field>
          <Field label="Purchase Price"><TextInput type="number" value={draft.purchasePrice} onChange={set("purchasePrice")} /></Field>
          <Field label="Place of Purchase"><TextInput value={draft.purchasePlace} onChange={set("purchasePlace")} /></Field>
          <Field label="Purchase Date"><TextInput type="date" value={draft.purchaseDate} onChange={set("purchaseDate")} /></Field>
        </div>

        <SectionTitle>Size</SectionTitle>
        <Field label="Size Label">
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap", marginTop: 14, marginBottom: 16,
    }}
  >
    {SIZE_OPTIONS.map((option) => {
      const active = draft.size === option;

      return (
        <button
          key={option}
          type="button"
          onClick={() => setField("size", option)}
          style={{
            minWidth: option === "FREE" ? 54 : 38,
            height: 34,
            padding: "0 10px",
            borderRadius: 17,
            border: `1px solid ${active ? COLOR.text : COLOR.border}`,
            background: active ? COLOR.text : COLOR.bg,
            color: active ? "#fff" : COLOR.text,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            transition: "all .15s",
          }}
        >
          {option}
        </button>
      );
    })}
  </div>
</Field>
        <Field label="Materials">
          <MaterialsEditor 
             materials={draft.materials} 
             onChange={(m) => setField("materials", m)} 
             materialLibrary={materialLibrary}
             onAddMaterialToLibrary={onAddMaterialToLibrary}
             materialFreq={materialFreq}
          />
        </Field>
        {getSizeFields(draft.category) && (
          <div style={{ marginBottom: 4 }}>
            <SizeDetailBox category={draft.category} draft={draft} onChangeField={setField} />
          </div>
        )}

        <SectionTitle>Memo</SectionTitle>
        <textarea value={draft.memo} onChange={set("memo")} rows={3}
          style={{ ...inputStyle, resize: "vertical", marginBottom: 18, fontFamily: "inherit" }} />

        <SectionTitle>Status Management</SectionTitle>
        <button type="button" onClick={() => setField("declutter", !draft.declutter)} style={{ ...chipBtnStyle(draft.declutter), marginBottom: draft.declutter ? 12 : 0 }}>
          To be decluttered
        </button>
        {draft.declutter && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            {DECLUTTER_METHODS.map((m) => (
              <button key={m} type="button" onClick={() => setField("declutterMethod", m)} style={{...chipBtnStyle(draft.declutterMethod === m), minWidth: 92, }}>
                {m}
              </button>
            ))}
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "16px 0 24px", cursor: "pointer" }}>
          <input type="checkbox" checked={draft.repairNeeded} onChange={setBool("repairNeeded")} style={{width: 15, height: 15, margin: 0, accentColor: "#2F2F2F", cursor: "pointer", }} />
          Repair Needed
        </label>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: "100%", padding: "11px 0", background: COLOR.bg, color: COLOR.subtext,
            border: `1px solid ${COLOR.border}`, borderRadius: 6, fontSize: 14, cursor: "pointer",
          }}>Delete</button>
        ) : (
          <div style={{ padding: 16, background: COLOR.bg2, borderRadius: 8, border: `1px solid ${COLOR.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4 }}>Move to Recycle Bin?</div>
            <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 14 }}>You can restore this item later.</div>

            <div style={{ marginBottom: 12 }}>
              <Field label="Deletion Reason">
                <Select value={delReason} onChange={(e) => setDelReason(e.target.value)}>
                  <option value="판매">판매</option>
                  <option value="기부">기부</option>
                  <option value="폐기">폐기</option>
                  <option value="기타">기타</option>
                </Select>
              </Field>

              {delReason === "판매" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="Selling Price" style={{ marginBottom: 0 }}>
                    <TextInput type="number" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value === "" ? "" : Number(e.target.value))} />
                  </Field>
                  <Field label="Date of Sale" style={{ marginBottom: 0 }}>
                    <TextInput type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: delReason === "판매" ? 0 : 14 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "9px 0", background: COLOR.bg, color: COLOR.text, border: `1px solid ${COLOR.border}`, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button 
                onClick={() => {
                   if (delReason === "판매" && (soldPrice === "" || soldPrice === undefined)) return;
                   onDelete(draft.id, delReason, soldPrice, soldDate);
                }} 
                disabled={delReason === "판매" && (soldPrice === "" || soldPrice === undefined)}
                style={{ flex: 1, padding: "9px 0", background: COLOR.text, color: "#fff", border: "none", borderRadius: 6, cursor: (delReason === "판매" && (soldPrice === "" || soldPrice === undefined)) ? "default" : "pointer", fontSize: 13, opacity: (delReason === "판매" && (soldPrice === "" || soldPrice === undefined)) ? 0.5 : 1 }}>
                Move
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface AddModalProps {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
function AddModal({ onClose, onAdd, brands, onAddBrand, materialLibrary, onAddMaterialToLibrary, materialFreq }: AddModalProps) {
  const [form, setForm] = useState<ClothingItem>(seedItem({}));
  const [mediaTab, setMediaTab] = useState("photos");
  const [newBrandTier, setNewBrandTier] = useState<BrandTier | string>(BRAND_TIERS[5]); 
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const initialFormRef = useRef(form);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialFormRef.current), [form]);

  // Unsaved Protection: Window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  
  const set = (k: keyof ClothingItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setField = (k: keyof ClothingItem, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    let targetBrandId = "";
    const matchedBrand = brands.find(b => b.name === form.brandName);
    if (form.brandName) {
      if (matchedBrand) {
        targetBrandId = matchedBrand.id;
      } else {
        targetBrandId = crypto.randomUUID();
        onAddBrand({
          id: targetBrandId,
          name: form.brandName,
          tier: newBrandTier,
          logo: newBrandLogo,
          memo: "",
          favorite: false,
          color: "#B8B8B8"
        });
      }
    }
    const toSave: Partial<ClothingItem> = { ...form, brandId: targetBrandId, addedAt: Date.now() };
    delete toSave.brandInfo; 
    onAdd(toSave as ClothingItem);
  };

  const handleCancel = () => {
    storeListLoad<ReferenceImage>("reference:").then(allRefs => {
      allRefs.filter(r => r.itemId === form.id).forEach(r => storeDelete(`reference:${r.id}`));
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(17,17,17,0.32)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={handleCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
        background: COLOR.bg, borderRadius: 10, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>Add Item</span>
          <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} color={COLOR.subtext} />
          </button>
        </div>

        <div style={{ marginBottom: 32, minHeight: 200 }}>
          <MediaTabs active={mediaTab} onChange={setMediaTab} />
          {mediaTab === "photos" && (
            <ImageManager images={form.images} onChange={(imgs) => setField("images", imgs)} />
          )}
          {mediaTab === "reference" && (
            <ReferenceManager itemId={form.id} />
          )}
        </div>

        <Field label="Brand">
          <BrandInput value={form.brandName} onChange={(v) => setField("brandName", v)} brands={brands.map(b => b.name)} />
          <FormBrandSection 
            formBrandName={form.brandName} brands={brands} 
            newTier={newBrandTier} setNewTier={setNewBrandTier} 
            newLogo={newBrandLogo} setNewLogo={setNewBrandLogo} 
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
          <Field label="Product Name"><TextInput value={form.name} onChange={set("name")} placeholder="" /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
  <Field label="Size Label">
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
    overflowX: "auto",
    paddingBottom: 2,
  }}
>
    {SIZE_OPTIONS.map((option) => {
  const active = form.size === option;

  return (
    <button
      key={option}
      type="button"
      onClick={() =>
        setForm((prev) => ({
          ...prev,
          size: option,
        }))
      }
      style={{
        minWidth: option === "FREE" ? 54 : 38,
        height: 34,
        padding: "0 10px",
        borderRadius: 17,
        border: `1px solid ${active ? COLOR.text : COLOR.border}`,
        background: active ? COLOR.text : COLOR.bg,
        color: active ? "#fff" : COLOR.text,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
        transition: "all .15s",
      }}
    >
      {option}
    </button>
  );
})}
  </div>
</Field>
</div>

          <Field label="Season" style={{ gridColumn: "1 / -1" }}>
            <SeasonPicker value={form.seasons} onChange={(v) => setField("seasons", v)} />
          </Field>
          <Field label="Retail Price"><TextInput type="number" value={form.price} onChange={set("price")} /></Field>
          <Field label="Purchase Price"><TextInput type="number" value={form.purchasePrice} onChange={set("purchasePrice")} /></Field>
          <Field label="Place of Purchase"><TextInput value={form.purchasePlace} onChange={set("purchasePlace")} /></Field>
          <Field label="Purchase Date"><TextInput type="date" value={form.purchaseDate} onChange={set("purchaseDate")} /></Field>
        </div>

        <Field label="Materials">
          <MaterialsEditor 
             materials={form.materials} 
             onChange={(m) => setField("materials", m)} 
             materialLibrary={materialLibrary}
             onAddMaterialToLibrary={onAddMaterialToLibrary}
             materialFreq={materialFreq}
          />
        </Field>

        <button onClick={handleSave} style={{
          width: "100%", marginTop: 8, padding: "12px 0", background: COLOR.text, color: "#fff",
          border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer",
        }}>Save</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Brand Detail Drawer (Auto-save)
--------------------------------------------------------- */
interface BrandDrawerProps {
  brand: Brand;
  onClose: () => void;
  onViewInWardrobe: (brandId: string) => void;
  onUpdateBrand: (updated: Brand) => void;
  items: ClothingItem[];
}
function BrandDrawer({ brand, onClose, onViewInWardrobe, onUpdateBrand, items }: BrandDrawerProps) {
  const { draft, setDraft, status, forceSave } = useAutoSave<Brand>(
    brand,
    (dataToSave) => {
      onUpdateBrand(dataToSave);
    },
    700,
    (b) => b.id
  );

  const handleClose = useCallback(() => {
    forceSave();
    onClose();
  }, [forceSave, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const stats = useMemo(() => {
    if (!draft) return null;
    const totalWardrobeCount = items.length;
    const bItems = items.filter(i => i.brandId === draft.id);
    const count = bItems.length;
    const percentage = totalWardrobeCount > 0 ? ((count / totalWardrobeCount) * 100).toFixed(1) : "0.0";

    let totalSpend = 0;
    let favCount = 0;
    const categoryCounts: Record<string, number> = {};
    const seasonCounts: Record<string, number> = { "봄/가을": 0, "여름": 0, "겨울": 0 };
    const dates: Date[] = [];

    bItems.forEach((i) => {
      totalSpend += Number(i.purchasePrice || 0);
      if (i.favorite) favCount++;
      if (i.category) categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
      (i.seasons || []).forEach((s) => {
        if (seasonCounts[s] !== undefined) seasonCounts[s]++;
      });
      if (i.purchaseDate) {
         const d = new Date(i.purchaseDate);
         if (!isNaN(d.getTime())) dates.push(d);
      }
    });

    const pricedItems = bItems.filter((i) => Number(i.purchasePrice || 0) > 0);
    const avgPrice = pricedItems.length ? Math.round(totalSpend / pricedItems.length) : 0;
    
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    const categoryList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const seasonChart = [
      { name: "봄/가을", value: seasonCounts["봄/가을"] },
      { name: "여름", value: seasonCounts["여름"] },
      { name: "겨울", value: seasonCounts["겨울"] }
    ];

    let avgDays = 0;
    let oldestDate = "-";
    let newestDate = "-";

    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      oldestDate = dates[0].toISOString().split('T')[0];
      newestDate = dates[dates.length - 1].toISOString().split('T')[0];

      const today = new Date();
      const totalMs = dates.reduce((sum, d) => sum + (today.getTime() - d.getTime()), 0);
      avgDays = Math.round((totalMs / dates.length) / (1000 * 60 * 60 * 24));
    }

    const recentItems = [...bItems].sort((a, b) => {
      const da = new Date(a.purchaseDate).getTime() || 0;
      const db = new Date(b.purchaseDate).getTime() || 0;
      return db - da; 
    });

    return { 
      count, percentage, totalSpend, avgPrice, favCount, 
      topCategory, categoryList, seasonChart,
      avgDays, oldestDate, newestDate, recentItems
    };
  }, [draft, items]);

  if (!draft || !stats) return null;

  const BStat = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "12px 14px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: COLOR.bg }}>
      <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 8, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: COLOR.text, letterSpacing: -0.3 }}>{value}</span>
        {sub && <span style={{ fontSize: 11.5, color: COLOR.subtext }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.28)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw",
        background: COLOR.bg, borderLeft: `1px solid ${COLOR.border}`, zIndex: 41,
        overflowY: "auto", padding: "22px 24px 40px", boxShadow: "-12px 0 32px rgba(0,0,0,0.06)",
      }}>

        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  }}
>
  {/* Left */}
<div style={{ flex: 1 }}>

  {/* Logo + Name */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 22,
    }}
  >
    <BrandLogoPicker
      value={draft.logo}
      onChange={(v) => setDraft(d => ({ ...d, logo: v }))}
    />

    <input
      value={draft.name}
      onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
      style={{
        fontSize: 20,
        fontWeight: 500,
        color: COLOR.text,
        border: "none",
        background: "transparent",
        outline: "none",
        padding: 0,
        width: 220,
        borderBottom: "1px solid transparent",
      }}
      onFocus={e => e.target.style.borderBottomColor = COLOR.text}
      onBlur={e => e.target.style.borderBottomColor = "transparent"}
    />
  </div>

  <div
  style={{
    display: "flex",
    alignItems: "flex-end",
    gap: 28,
    marginBottom: 22,
  }}
>
  <div>
    <div
      style={{
        fontSize: 11,
        color: COLOR.subtext,
        marginBottom: 6,
      }}
    >
      Category
    </div>

    <Select
      value={draft.tier}
      onChange={e => setDraft(d => ({ ...d, tier: e.target.value }))}
      style={{
        width: 170,
        padding: "6px 10px",
        fontSize: 12,
      }}
    >
      {BRAND_TIERS.map(t => (
        <option key={t}>{t}</option>
      ))}
    </Select>
  </div>

  <div>
  <div
    style={{
      fontSize: 11,
      color: COLOR.subtext,
      marginBottom: 4.5,
    }}
  >
    Color
  </div>

  <div
  style={{
      width: 45,
      height: 32,
      border: `1px solid ${COLOR.border}`,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLOR.bg,
      boxSizing: "border-box",
      marginTop: 2,
  }}
>
    <input
      type="color"
      value={draft.color || "#B8B8B8"}
      onChange={e =>
        setDraft(d => ({
          ...d,
          color: e.target.value,
        }))
      }
      style={{
        width: 20,
        height: 16,
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "transparent",
      }}
    />
  </div>
</div>
</div>

</div>

  {/* Right */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    {status === "saving" && (
      <span
        style={{
          fontSize: 11,
          color: COLOR.subtext,
        }}
      >
        Saving...
      </span>
    )}

    {status === "saved" && (
      <span
        style={{
          fontSize: 11,
          color: COLOR.subtext,
        }}
      >
        Saved
      </span>
    )}

    <button
      onClick={() =>
        setDraft(d => ({
          ...d,
          favorite: !d.favorite,
        }))
      }
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
      }}
    >
      <Heart
        size={18}
        color={COLOR.text}
        fill={draft.favorite ? COLOR.text : "none"}
        strokeWidth={1.6}
      />
    </button>

    <button
      onClick={handleClose}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
      }}
    >
      <X size={18} color={COLOR.subtext} />
    </button>
  </div>
</div>

        <div style={{ borderTop: `1px solid ${COLOR.border}`, opacity: 0.6, marginBottom: 20 }} />

        <SectionTitle>Memo</SectionTitle>
        <textarea
          value={draft.memo || ""}
          onChange={(e) => setDraft(d => ({ ...d, memo: e.target.value }))}
          rows={3}
          placeholder="Add a memo for this brand..."
          style={{ ...inputStyle, resize: "vertical", marginBottom: 18, fontFamily: "inherit" }}
        />

        <SectionTitle>Statistics</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <BStat label="Items Owned" value={`${stats.count}`} sub={`${stats.percentage}% of total`} />
          <BStat label="Favorites" value={`${stats.favCount}`} sub={`out of ${stats.count}`} />
          <BStat label="Total Spending" value={fmtWon(stats.totalSpend)} />
          <BStat label="Average Purchase Price" value={fmtWon(stats.avgPrice)} />
          <BStat label="Avg. Ownership" value={`${stats.avgDays} days`} />
          <BStat label="Latest Purchase" value={stats.newestDate} />
          <BStat label="First Purchase" value={stats.oldestDate} />
          <BStat label="Top Category" value={stats.topCategory} />
        </div>

        <SectionTitle>Season Distribution</SectionTitle>
        <div style={{ height: 140, marginBottom: 24, marginLeft: -25 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.seasonChart} margin={{ left: 0, bottom: 0, top: 10 }}>
              <CartesianGrid vertical={false} stroke={COLOR.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLOR.subtext }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: COLOR.subtext }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: COLOR.bg2 }} contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} />
              <Bar dataKey="value" fill={draft.color || COLOR.text} radius={[2, 2, 0, 0]} maxBarSize={32} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Category Distribution</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {stats.categoryList.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
              <div style={{ width: 60, color: COLOR.subtext }}>{c.name}</div>
              <div style={{ flex: 1, height: 6, background: COLOR.bg2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(c.value / stats.count) * 100}%`, height: '100%', background: draft.color || COLOR.text, opacity: 0.8 }} />
              </div>
              <div style={{ width: 20, textAlign: 'right', fontWeight: 500, color: COLOR.text }}>{c.value}</div>
            </div>
          ))}
          {stats.categoryList.length === 0 && <div style={{ fontSize: 12, color: COLOR.subtext }}>No data</div>}
        </div>

        <SectionTitle>Collection</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 12px", marginBottom: 8 }}>
          {stats.recentItems.slice(0, 8).map((item) => (
            <ClothingCard key={item.id} item={item} onOpen={() => {}} onToggleFavorite={() => {}} accentColor={draft.color} />
          ))}
          {stats.recentItems.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: COLOR.subtext, fontSize: 13, background: COLOR.bg2, borderRadius: 6 }}>
              No items
            </div>
          )}
        </div>

        <button
          onClick={() => onViewInWardrobe(draft.id)}
          style={{
            width: "100%", marginTop: 10, padding: "12px 0", background: COLOR.text, color: "#fff",
            border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          <Shirt size={16} /> View in Wardrobe
        </button>
      </div>
    </>
  );
}

interface BrandCardProps {
  brand: BrandWithStats;
  onClick: () => void;
}
interface BrandCardProps {
  brand: BrandWithStats;
  onClick: () => void;
}

function BrandCard({ brand, onClick }: BrandCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover ? "#C9C9C9" : COLOR.border}`,
        borderRadius: 8,
        padding: 20,
        background: COLOR.bg,
        cursor: "pointer",
        transition: "border-color .15s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left Accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: brand.color || "#B8B8B8",
        }}
      />

      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <BrandLogo src={brand.logo} size={18} />

        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: COLOR.text,
            lineHeight: 1.2,
          }}
        >
          {brand.name}
        </div>
      </div>

      {/* Category */}
      <div
        style={{
          fontSize: 12,
          color: COLOR.subtext,
          marginBottom: 16,
          paddingLeft: brand.logo ? 26 : 0,
          textAlign: "left",
          width: "100%",
        }}
      >
        {brand.tier}
      </div>

      {/* Bottom */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${COLOR.border}`,
          paddingTop: 12,
          fontSize: 12.5,
          color: COLOR.subtext,
        }}
      >
        <span>{brand.items.length} items</span>

        <span>{fmtWon(brand.total)}</span>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS / PAGES SECTION
========================================================= */

// --- src/components/Sidebar.tsx ---
const NAV: { key: PageType; label: string; icon: React.ElementType }[] = [
  { key: "wardrobe", label: "Wardrobe", icon: Shirt },
  { key: "brands", label: "Brands", icon: Tag },
  { key: "stats", label: "Statistics", icon: BarChart3 },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "trash", label: "Recycle Bin", icon: Trash2 },
];

interface SidebarProps {
  page: PageType;
  setPage: (p: PageType) => void;
  count: number;
  onOpenData: () => void;
}
function Sidebar({ page, setPage, count, onOpenData }: SidebarProps) {
  return (
    <div style={{
      width: 224, minWidth: 224, height: "100vh", background: COLOR.bg2,
      borderRight: `1px solid ${COLOR.border}`, display: "flex", flexDirection: "column",
      padding: "22px 14px", boxSizing: "border-box", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "0 8px", marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, border: `1.5px solid ${COLOR.text}`, borderRadius: 4 }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2.5, color: COLOR.text }}>ARCHIVE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = page === key;
          return (
            <button key={key} onClick={() => setPage(key)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 10px", background: isActive ? COLOR.bg : "transparent",
              border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left",
              boxShadow: isActive ? `0 0 0 1px ${COLOR.border}` : "none",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={15} color={isActive ? COLOR.text : COLOR.subtext} strokeWidth={1.7} />
                <span style={{ fontSize: 13.5, color: isActive ? COLOR.text : COLOR.subtext, fontWeight: isActive ? 500 : 400 }}>
                  {label}
                </span>
              </span>
              {key === "wardrobe" && <span style={{ fontSize: 11.5, color: COLOR.subtext }}>{count}</span>}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button onClick={onOpenData} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", background: "transparent",
            border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", width: "100%"
          }}>
            <Database size={15} color={COLOR.subtext} strokeWidth={1.7} />
            <span style={{ fontSize: 13.5, color: COLOR.subtext, fontWeight: 400 }}>Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- src/pages/WardrobePage.tsx ---
interface WardrobePageProps {
  query: string;
  setQuery: (q: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sorts: SortState[];
  setSorts: React.Dispatch<React.SetStateAction<SortState[]>>;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  gallerySize: number;
  handleGallerySizeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setAddOpen: (open: boolean) => void;
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  brands: Brand[];
  availableBrands: Brand[];
  toggleFilter: <K extends keyof FilterState>(key: K, val: any) => void;
  filtered: ClothingItem[];
  setSelected: (item: ClothingItem | null) => void;
  toggleFavorite: (id: string) => void;
}
function WardrobePage({
  query, setQuery, searchRef,
  sortOpen, setSortOpen, sorts, setSorts,
  viewMode, setViewMode, gallerySize, handleGallerySizeChange,
  setAddOpen,
  filterOpen, setFilterOpen, activeFilterCount, filters, setFilters,
  brands, availableBrands, toggleFilter,
  filtered, setSelected, toggleFavorite
}: WardrobePageProps) {

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) 
        {setFilterOpen(false);}
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) 
        {setSortOpen(false);}
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setFilterOpen]);
  
  return (
    <>
      <PageHeader title="Wardrobe" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Search size={15} color={COLOR.subtext} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 60 }} />
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: COLOR.subtext, border: `1px solid ${COLOR.border}`,
            borderRadius: 4, padding: "1px 6px", display: "flex", alignItems: "center", gap: 2,
          }}>
            <Command size={10} />K
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div ref={sortRef} style={{ position: "relative" }}>
            <IconBtn onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }} active={sortOpen || sorts.length > 0}>
              <ArrowUpDown size={14} /> Sort {sorts.length > 0 && `(${sorts.length})`}
            </IconBtn>
            {sortOpen && <SortPanel sorts={sorts} setSorts={setSorts} fields={CLOTHING_SORT_FIELDS} defaultKey="addedAt" />}
          </div>

          {viewMode === "gallery" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6, marginRight: 6 }}>
              <LayoutGrid size={13} color={COLOR.subtext} strokeWidth={2} />
              <input
                type="range"
                min="140"
                max="280"
                step="10"
                value={gallerySize}
                onChange={handleGallerySizeChange}
                className="minimal-slider"
                style={{ width: 64, outline: "none" }}
              />
              <Square size={13} color={COLOR.subtext} strokeWidth={2} />
              <div style={{ width: 1, height: 16, background: COLOR.border, marginLeft: 6 }} />
            </div>
          )}

          <div style={{ display: "flex", border: `1px solid ${COLOR.border}`, borderRadius: 6, overflow: "hidden" }}>
            <button onClick={() => setViewMode("gallery")} style={{ padding: "7px 10px", background: viewMode === "gallery" ? COLOR.bg2 : COLOR.bg, border: "none", cursor: "pointer", display: "flex" }}>
              <LayoutGrid size={14} color={COLOR.text} />
            </button>
            <button onClick={() => setViewMode("table")} style={{ padding: "7px 10px", background: viewMode === "table" ? COLOR.bg2 : COLOR.bg, border: "none", cursor: "pointer", display: "flex", borderLeft: `1px solid ${COLOR.border}` }}>
              <Rows3 size={14} color={COLOR.text} />
            </button>
          </div>
          <button onClick={() => setAddOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLOR.text,
            color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer",
          }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      <div ref={filterRef} style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
    position: "relative",
  }}
>
        <IconBtn onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }} active={filterOpen || activeFilterCount > 0}>
          <SlidersHorizontal size={14} /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </IconBtn>
        
        {filters.brands.map(bId => {
          const b = brands.find(x => x.id === bId);
          return b ? <ActiveChip key={bId} label={b.name} onRemove={() => toggleFilter('brands', bId)} /> : null;
        })}
        {filters.season.map(s => <ActiveChip key={s} label={s} onRemove={() => toggleFilter('season', s)} />)}
        {filters.category.map(c => <ActiveChip key={c} label={c} onRemove={() => toggleFilter('category', c)} />)}
        {filters.favoriteOnly && <ActiveChip label="Favorite" onRemove={() => setFilters(f => ({ ...f, favoriteOnly: false }))} icon={<Heart size={10} fill={COLOR.text} />} />}

        {filterOpen && <FilterPopover filters={filters} setFilters={setFilters} availableBrands={availableBrands} />}
      </div>

      {viewMode === "gallery" ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${gallerySize}px, 1fr))`, gap: "28px 22px" }}>
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} onOpen={setSelected} onToggleFavorite={toggleFavorite} />
          ))}
          {filtered.length === 0 && <EmptyState text="" />}
        </div>
      ) : (
        <TableView items={filtered} onOpen={setSelected} />
      )}
    </>
  );
}

// --- src/pages/BrandsPage.tsx ---
interface BrandsPageProps {
  brandsWithStats: BrandWithStats[];
  onSelectBrand: (b: BrandWithStats) => void;
  sorts: SortState[];
  setSorts: React.Dispatch<React.SetStateAction<SortState[]>>;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
function BrandsPage({ brandsWithStats, onSelectBrand, sorts, setSorts, sortOpen, setSortOpen }: BrandsPageProps) {
  const sortRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (sortRef.current && !sortRef.current.contains(target)
    ) { setSortOpen(false); }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [setSortOpen]);

  return (
    <div>
      <PageHeader 
        title="Brands" 
        action={
          <div 
           ref={sortRef}
           style={{ position: "relative", zIndex: 20 }}
          >
            <IconBtn onClick={() => setSortOpen((v) => !v)} active={sortOpen || sorts.length > 0}>
              <ArrowUpDown size={14} /> Sort {sorts.length > 0 && `(${sorts.length})`}
            </IconBtn>
            {sortOpen && <SortPanel sorts={sorts} setSorts={setSorts} fields={BRAND_SORT_FIELDS} defaultKey="itemsCount" />}
          </div>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {brandsWithStats.map((b) => (
          <BrandCard key={b.id} brand={b} onClick={() => onSelectBrand(b)} />
        ))}
        {brandsWithStats.length === 0 && <EmptyState text="" />}
      </div>
    </div>
  );
}

// --- src/pages/StatisticsPage.tsx ---
interface StatisticsPageProps {
  items: ClothingItem[];
  brands: Brand[];
  sales: SaleRecord[];
}
function StatisticsPage({ items, brands, sales }: StatisticsPageProps) {
  const [seasonTab, setSeasonTab] = useState<Season | "All">("All");

  const filteredItems = useMemo(() => {
    if (seasonTab === "All") return items;
    return items.filter(it => (it.seasons || []).includes(seasonTab));
  }, [items, seasonTab]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const favs = filteredItems.filter((i) => i.favorite).length;
    const favRatio = total > 0 ? ((favs / total) * 100).toFixed(1) : "0.0";

    const pricedItems = filteredItems.filter((i) => Number(i.purchasePrice) > 0);
    const totalSpend = filteredItems.reduce((sum, i) => sum + Number(i.purchasePrice || 0), 0);
    const avgSpend = pricedItems.length > 0 ? Math.round(totalSpend / pricedItems.length) : 0;

    const byCategory: Record<string, number> = {};
    const bySeason: Record<string, number> = {}; SEASONS.forEach((s) => { bySeason[s] = 0; });
    const byBrand: Record<string, number> = {};
    const byMaterial: Record<string, number> = {};

    filteredItems.forEach((i) => {
      if (i.category) byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      (i.seasons || []).forEach((s) => { if (bySeason[s] !== undefined) bySeason[s] += 1; });
      (i.materials || []).forEach((m) => {
        byMaterial[m.name] = (byMaterial[m.name] || 0) + 1;
      });
      
      const brandTier = i.brandInfo?.tier || "보세";
      if (i.brandId && brandTier !== "보세") {
        byBrand[i.brandId] = (byBrand[i.brandId] || 0) + 1;
      }
    });

    const category = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const season = SEASONS.map((s) => ({ name: s, value: bySeason[s] }));

    const brandEntries = Object.entries(byBrand).map(([bId, value]) => {
      const bName = brands.find(b => b.id === bId)?.name || "Unknown";
      return { id: bId, name: bName, value };
    }).sort((a, b) => b.value - a.value);
    
    let brandChart = brandEntries;
    if (brandEntries.length > 10) {
      const top = brandEntries.slice(0, 10);
      const restSum = brandEntries.slice(10).reduce((s, e) => s + e.value, 0);
      brandChart = [...top, { id: "others", name: "Others", value: restSum }];
    }

    const materialEntries = Object.entries(byMaterial).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    let materialChart = materialEntries;
    if (materialEntries.length > 10) {
      const top = materialEntries.slice(0, 10);
      const restSum = materialEntries.slice(10).reduce((s, e) => s + e.value, 0);
      materialChart = [...top, { name: "Others", value: restSum }];
    }

    return {
      total, favs, favRatio,
      totalSpend, avgSpend,
      category, season, brandChart, materialChart
    };
  }, [filteredItems, brands]);

  const saleStats = useMemo(() => {
    const validSales = sales.filter(s => s.soldPrice !== null && s.soldPrice !== undefined);
    const totalRevenue = validSales.reduce((sum, s) => sum + Number(s.soldPrice || 0), 0);
    const avgSellingPrice = validSales.length > 0 ? Math.round(totalRevenue / validSales.length) : 0;
    return { totalRevenue, avgSellingPrice, count: validSales.length };
  }, [sales]);

  const StatBlock = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", }}>
      <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 8, letterSpacing: 0.2, textAlign: "center", }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, }}>
        <span style={{ fontSize: 24, fontWeight: 500, color: COLOR.text, letterSpacing: -0.5 }}>{value}</span>
        {sub && <span style={{ fontSize: 13, color: COLOR.subtext }}>{sub}</span>}
      </div>
    </div>
  );

  const brandChartHeight = Math.max(160, stats.brandChart.length * 32);
  const materialChartHeight = Math.max(160, stats.materialChart.length * 32);

  return (
    <div style={{ paddingBottom: 60 }}>
      <PageHeader title="Statistics" />

      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${COLOR.border}`, marginBottom: 36 }}>
        {[{key: "All", label: "All"}, {key: "봄/가을", label: "Spring / Fall"}, {key: "여름", label: "Summer"}, {key: "겨울", label: "Winter"}].map(tab => {
          const isActive = seasonTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSeasonTab(tab.key as Season | "All")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 4px 10px", fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                color: isActive ? COLOR.text : COLOR.subtext,
                borderBottom: isActive ? `2px solid ${COLOR.text}` : "2px solid transparent",
                marginBottom: "-1px"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 40px", justifyItems: "center", }}>
          <StatBlock label="Total Items" value={`${stats.total}`} />
          <StatBlock label="Favorites" value={`${stats.favs}`} sub={`/ ${stats.total} (${stats.favRatio}%)`} />
          <StatBlock label="Total Spending" value={fmtWon(stats.totalSpend)} />
          <StatBlock label="Average Purchase Price" value={fmtWon(stats.avgSpend)} />
        </div>
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Category</SectionTitle>
        {stats.category.length > 0 ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 20, alignItems: "center" }}>
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.category} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {stats.category.map((_, i) => <Cell key={i} fill={GRAYS[i % GRAYS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} itemStyle={{ color: COLOR.text }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.category.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLOR.subtext }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GRAYS[i % GRAYS.length] }} />
                  <span style={{ width: 100 }}>{c.name}</span>
                  <span style={{ width: 20, textAlign: "right", color: COLOR.text, fontWeight: 500, }}>
                    {c.value} </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Season</SectionTitle>
        {stats.total > 0 ? (
          <div style={{ height: 220, maxWidth: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.season} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COLOR.border} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLOR.subtext }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLOR.subtext }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: COLOR.bg2 }} contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} />
                <Bar dataKey="value" fill={COLOR.text} radius={[2, 2, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Brand</SectionTitle>
        {stats.brandChart.length > 0 ? (
          <div style={{ height: brandChartHeight, maxWidth: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.brandChart} layout="vertical" margin={{ left: 10, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={COLOR.border} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12.5, fill: COLOR.text }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
                <Tooltip cursor={{ fill: COLOR.bg2 }} contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} />
                <Bar dataKey="value" fill={COLOR.text} radius={[0, 2, 2, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Material</SectionTitle>
        {stats.materialChart.length > 0 ? (
          <div style={{ height: materialChartHeight, maxWidth: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.materialChart} layout="vertical" margin={{ left: 10, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={COLOR.border} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12.5, fill: COLOR.text }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
                <Tooltip cursor={{ fill: COLOR.bg2 }} contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} />
                <Bar dataKey="value" fill={COLOR.text} radius={[0, 2, 2, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

      <div>
        <SectionTitle>Sale History</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 40px" }}>
          <StatBlock label="Total Revenue" value={saleStats.count > 0 ? fmtWon(saleStats.totalRevenue) : "-"} />
          <StatBlock label="Average Selling Price" value={saleStats.count > 0 ? fmtWon(saleStats.avgSellingPrice) : "-"} />
        </div>
      </div>
    </div>
  );
}

// --- src/pages/CalendarPage.tsx ---
interface CalendarPageProps {
  items: ClothingItem[];
  brands: Brand[];
  onOpenItem: (item: ClothingItem) => void;
}

function CalendarPage({ items, brands, onOpenItem }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterCategory, setFilterCategory] =  useState<CategoryGroup | "All">("All");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterDate = useCallback((dateStr: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredDateStr(dateStr);
  }, []);

  const handleMouseLeaveDate = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDateStr(null);
    }, 150);
  }, []);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const validItems = useMemo(() => items.filter(i => i.purchaseDate), [items]);

  const monthItems = useMemo(() => {
    return validItems.filter(i => {
      const d = new Date(i.purchaseDate);
      return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
    });
  }, [validItems, currentDate]);

  const filteredMonthItems = useMemo(() => {
    if (filterCategory === "All") return monthItems;
    return monthItems.filter((item) =>
      CATEGORY_GROUPS[filterCategory].includes(item.category as Category)
    );
  }, [monthItems, filterCategory]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ClothingItem[]> = {};
    filteredMonthItems.forEach(item => {
      if (!groups[item.purchaseDate]) groups[item.purchaseDate] = [];
      groups[item.purchaseDate].push(item);
    });
    return groups;
  }, [filteredMonthItems]);

  const stats = useMemo(() => {
    const count = monthItems.length;
    const spend = monthItems.reduce((sum, i) => sum + Number(i.purchasePrice || 0), 0);

    const allSorted = [...validItems].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
    let avgGap = 0;
    let daysSinceLast = 0;

    if (allSorted.length > 1) {
      let totalGap = 0;
      for(let i=1; i<allSorted.length; i++) {
        totalGap += new Date(allSorted[i].purchaseDate).getTime() - new Date(allSorted[i-1].purchaseDate).getTime();
      }
      avgGap = Math.round(totalGap / (allSorted.length - 1) / (1000 * 3600 * 24));
    }

    if (allSorted.length > 0) {
      const lastDate = new Date(allSorted[allSorted.length - 1].purchaseDate);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      daysSinceLast = Math.max(0, Math.floor((todayStart.getTime() - lastStart.getTime()) / (1000 * 3600 * 24)));
    }

    return { count, spend, avgGap, daysSinceLast };
  }, [monthItems, validItems]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const filterOptions: ("All" | CategoryGroup)[] = [
  "All",
  "Tops",
  "Dress",
  "Bottoms",
  "Outerwear",
  "Others",];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>Calendar</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} color={COLOR.subtext} /></button>
          <div style={{ fontSize: 16, fontWeight: 500, color: COLOR.text, minWidth: 120, textAlign: "center" }}>{monthName}</div>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronRight size={20} color={COLOR.subtext} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Monthly Items" value={`${stats.count} ${stats.count === 1 ? "item" : "items"}`} />
        <StatBox label="Monthly Spending" value={fmtWon(stats.spend)} />
        <StatBox label="Avg. Purchase Gap" value={`${stats.avgGap} ${stats.avgGap === 1 ? "day" : "days"}`} />
        <StatBox label="Days Since Last Purchase" value={`${stats.daysSinceLast} ${stats.daysSinceLast === 1 ? "day" : "days"}`} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {filterOptions.map(cat => {
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: "6px 14px", fontSize: 12.5, borderRadius: 20, cursor: "pointer",
                border: `1px solid ${active ? COLOR.text : COLOR.border}`,
                background: active ? COLOR.text : COLOR.bg,
                color: active ? "#fff" : COLOR.text,
                transition: "all 0.15s ease"
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${COLOR.border}`, borderLeft: `1px solid ${COLOR.border}`, borderRadius: "8px 8px 0 0", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {dayLabels.map((day, i) => (
            <div key={day} style={{ 
              padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 500, color: COLOR.subtext, 
              borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`,
              borderTopLeftRadius: i === 0 ? 8 : 0,
              borderTopRightRadius: i === dayLabels.length - 1 ? 8 : 0,
              background: COLOR.bg2 
            }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`, minHeight: 110, background: COLOR.bg2, opacity: 0.3 }} />;
            
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateStr = `${y}-${m}-${dStr}`;
            const dayItems = groupedByDate[dateStr] || [];

            const colIndex = (firstDayOfWeek + day - 1) % 7;
            const rowIndex = Math.floor((firstDayOfWeek + day - 1) / 7);
            const totalRows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
            const isFirstCol = colIndex === 0;
            const isLastCol = colIndex === 6;
            const isBottomRow = rowIndex >= totalRows - 2;

            return (
              <div 
                key={dateStr} 
                onClick={() => dayItems.length > 0 && setSelectedDateStr(dateStr)}
                style={{ 
                  position: "relative",
                  borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`, 
                  minHeight: 110, padding: 8, display: "flex", flexDirection: "column",
                  cursor: dayItems.length > 0 ? "pointer" : "default",
                  transition: "background 0.2s",
                  background: COLOR.bg
                }}
                onMouseEnter={(e) => { 
                  if (dayItems.length > 0) {
                    e.currentTarget.style.background = COLOR.bg2;
                    handleMouseEnterDate(dateStr);
                  }
                }}
                onMouseLeave={(e) => { 
                  if (dayItems.length > 0) {
                    e.currentTarget.style.background = COLOR.bg;
                    handleMouseLeaveDate();
                  }
                }}
              >
                <div style={{ fontSize: 13, color: dayItems.length > 0 ? COLOR.text : COLOR.subtext, fontWeight: dayItems.length > 0 ? 500 : 400, marginBottom: 8 }}>{day}</div>
                <div style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap", alignContent: "flex-start" }}>
                  {dayItems.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ width: 32, height: 40, borderRadius: 4, overflow: "hidden", background: COLOR.bg2, border: `1px solid ${COLOR.border}` }}>
                      {item.images[0] && <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div style={{ width: 32, height: 40, borderRadius: 4, background: COLOR.bg2, border: `1px dashed ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: COLOR.subtext }}>
                      +{dayItems.length - 2}
                    </div>
                  )}
                </div>

                {hoveredDateStr === dateStr && dayItems.length > 0 && (
                  <div 
                    onMouseEnter={() => handleMouseEnterDate(dateStr)}
                    onMouseLeave={handleMouseLeaveDate}
                    style={{
                      position: "absolute",
                      top: isBottomRow ? "auto" : "calc(100% + 4px)",
                      bottom: isBottomRow ? "calc(100% + 4px)" : "auto",
                      left: isFirstCol ? 0 : isLastCol ? "auto" : "50%",
                      right: isLastCol ? 0 : "auto",
                      transform: isFirstCol || isLastCol ? "none" : "translateX(-50%)",
                      width: 240,
                      maxHeight: 320,
                      overflowY: "auto",
                      background: COLOR.bg,
                      border: `1px solid ${COLOR.border}`,
                      borderRadius: 8,
                      boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                      padding: 8,
                      zIndex: 50,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      cursor: "default"
                    }}
                  >
                    {dayItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={(e) => { e.stopPropagation(); onOpenItem(item); setHoveredDateStr(null); }}
                        style={{ display: "flex", gap: 12, padding: 8, borderRadius: 6, transition: "background 0.2s", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 44, height: 56, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0, border: `1px solid ${COLOR.border}` }}>
                          {item.images[0] && <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 2 }}>{item.brandName}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SectionTitle>Timeline</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingLeft: 16 }}>
        {sortedDates.length === 0 && <div style={{ fontSize: 13.5, color: COLOR.subtext, padding: "20px 0" }}>No purchase records for this month.</div>}
        {sortedDates.map(dateStr => (
          <div key={dateStr} style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: -24, top: 4, width: 8, height: 8, borderRadius: "50%", background: COLOR.text }} />
            <div style={{ position: "absolute", left: -21, top: 20, bottom: -24, width: 2, background: COLOR.border }} />
            
            <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.text, marginBottom: 12 }}>
              {new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groupedByDate[dateStr].map(item => (
                <div key={item.id} onClick={() => onOpenItem(item)} style={{ display: "flex", gap: 16, padding: 16, border: `1px solid ${COLOR.border}`, borderRadius: 8, background: COLOR.bg, cursor: "pointer", transition: "border-color 0.2s" }}
                     onMouseEnter={e => e.currentTarget.style.borderColor = "#C9C9C9"}
                     onMouseLeave={e => e.currentTarget.style.borderColor = COLOR.border}>
                  <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                    {item.images[0] && <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{item.brandName}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedDateStr && (
        <>
          <div onClick={() => setSelectedDateStr(null)} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.28)", zIndex: 37 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw", background: COLOR.bg, borderLeft: `1px solid ${COLOR.border}`, zIndex: 38, overflowY: "auto", padding: "22px 24px 40px", boxShadow: "-12px 0 32px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: COLOR.text }}>
                {new Date(selectedDateStr).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <button onClick={() => setSelectedDateStr(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <X size={18} color={COLOR.subtext} />
              </button>
            </div>
            
            <SectionTitle>Purchased Items</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(groupedByDate[selectedDateStr] || []).map(item => (
                <div key={item.id} onClick={() => onOpenItem(item)} style={{ display: "flex", gap: 14, padding: 12, border: `1px solid ${COLOR.border}`, borderRadius: 8, cursor: "pointer", background: COLOR.bg }}
                     onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                     onMouseLeave={e => e.currentTarget.style.background = COLOR.bg}>
                   <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                     {item.images[0] && <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
                   </div>
                   <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                     <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 4 }}>{item.brandName}</div>
                     <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 8 }}>{item.name}</div>
                     <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- src/pages/TrashPage.tsx ---
interface TrashPageProps {
  items: ClothingItem[];
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
  autoDeleteDays: number | null;
  onAutoDeleteChange: (days: number | null) => void;
}

function TrashPage({ items, onRestore, onHardDelete, onRestoreAll, onEmptyTrash, autoDeleteDays, onAutoDeleteChange }: TrashPageProps) {
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
        <div>
            <PageHeader title="Recycle Bin" />
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: -8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <span style={{ fontSize: 12.5, color: COLOR.subtext }}>Auto-delete:</span>
              <Select 
                value={autoDeleteDays === null ? "null" : String(autoDeleteDays)}
                onChange={(e) => onAutoDeleteChange(e.target.value === "null" ? null : Number(e.target.value))}
                style={{ padding: "0px 10px", fontSize: 13, width: 110, height: 36, background: COLOR.bg2 }}
              >
                <option value="null">Never</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </Select>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button 
            onClick={onRestoreAll} 
            disabled={items.length === 0} 
            style={{ padding: "9px 16px", fontSize: 13, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, cursor: items.length ? "pointer" : "default", opacity: items.length ? 1 : 0.5, color: COLOR.text }}
          >
            Restore All
          </button>
          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setShowEmptyConfirm(true)} 
              disabled={items.length === 0} 
              style={{ padding: "9px 16px", fontSize: 13, background: COLOR.bg, color: "#D93025", border: `1px solid #FCE8E6`, borderRadius: 6, cursor: items.length ? "pointer" : "default", opacity: items.length ? 1 : 0.5 }}
            >
              Empty Bin
            </button>
            {showEmptyConfirm && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 260, padding: 16, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 8, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4 }}>Empty Recycle Bin?</div>
                <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 14 }}>This action cannot be undone.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowEmptyConfirm(false)} style={{ flex: 1, padding: "8px 0", background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: COLOR.text }}>Cancel</button>
                  <button onClick={() => { onEmptyTrash(); setShowEmptyConfirm(false); }} style={{ flex: 1, padding: "8px 0", background: "#D93025", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}>Delete All</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState text="No deleted items." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`, gap: "28px 22px" }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column" }}>
              <ClothingCard item={item} />
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => onRestore(item.id)} style={{ flex: 1, padding: "8px 0", fontSize: 12.5, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, cursor: "pointer", color: COLOR.text }}>Restore</button>
                <button onClick={() => onHardDelete(item.id)} style={{ flex: 1, padding: "8px 0", fontSize: 12.5, background: COLOR.bg, color: "#D93025", border: `1px solid #FCE8E6`, borderRadius: 6, cursor: "pointer" }}>Delete Permanently</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: COLOR.subtext, textAlign: "center" }}>
                Deleted: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Data Modal Component ---
interface DataModalProps {
  onClose: () => void;
}

function DataModal({ onClose }: DataModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmData, setConfirmData] = useState<ArchiveData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    try {
      const items = await storeListLoad<ClothingItem>("item:");
      const brands = await storeListLoad<Brand>("brand:");
      const materials = await storeListLoad<MaterialLibraryItem>("material:");
      const references = await storeListLoad<ReferenceImage>("reference:");
      const sales = await storeListLoad<SaleRecord>("sale:");

      const archive: ArchiveData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items,
        brands,
        materials,
        references,
        sales,
        settings: {
          gallerySize: Number(localStorage.getItem("wardrobe_gallery_size")) || 200,
          autoDeleteDays: localStorage.getItem("wardrobe_auto_delete_days") === "null" ? null : Number(localStorage.getItem("wardrobe_auto_delete_days"))
        }
      };

      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `Archive_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setErrorMsg("Failed to export archive.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version !== 1 || !Array.isArray(json.items) || !Array.isArray(json.brands)) {
          setErrorMsg("Invalid archive file.");
          return;
        }
        setConfirmData(json);
      } catch (err) {
        setErrorMsg("Invalid archive file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmRestore = async () => {
    if (!confirmData) return;
    setRestoring(true);
    try {
      const prefixes = ["item:", "brand:", "material:", "reference:", "sale:"];
for (const prefix of prefixes) {
  const keysToDelete: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    localStorage.removeItem(key);
  }
}

      for (const item of confirmData.items || []) await storeSet(`item:${item.id}`, JSON.stringify(item));
      for (const brand of confirmData.brands || []) await storeSet(`brand:${brand.id}`, JSON.stringify(brand));
      for (const mat of confirmData.materials || []) await storeSet(`material:${mat.id}`, JSON.stringify(mat));
      for (const ref of confirmData.references || []) await storeSet(`reference:${ref.id}`, JSON.stringify(ref));
      for (const sale of confirmData.sales || []) await storeSet(`sale:${sale.id}`, JSON.stringify(sale));

      if (confirmData.settings) {
        if (confirmData.settings.gallerySize) localStorage.setItem("wardrobe_gallery_size", confirmData.settings.gallerySize.toString());
        if (confirmData.settings.autoDeleteDays !== undefined) localStorage.setItem("wardrobe_auto_delete_days", String(confirmData.settings.autoDeleteDays));
      }

      window.location.reload();
    } catch (err) {
      setErrorMsg("Failed to restore archive.");
      setRestoring(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.32)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 320, background: COLOR.bg, borderRadius: 10, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>Data</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color={COLOR.subtext} /></button>
        </div>
        
        {!confirmData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleExport} style={{ width: "100%", padding: "11px 0", background: COLOR.bg, color: COLOR.text, border: `1px solid ${COLOR.border}`, borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              Export Archive
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: "11px 0", background: COLOR.bg, color: COLOR.text, border: `1px solid ${COLOR.border}`, borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              Import Archive
            </button>
            {errorMsg && <div style={{ fontSize: 12, color: "#D93025", textAlign: "center", marginTop: 8 }}>{errorMsg}</div>}
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        ) : (
          <div style={{ padding: 16, background: COLOR.bg2, borderRadius: 8, border: `1px solid ${COLOR.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4 }}>Replace current archive?</div>
            <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 16 }}>Current data will be overwritten.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmData(null); setErrorMsg(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} disabled={restoring} style={{ flex: 1, padding: "8px 0", background: COLOR.bg, color: COLOR.text, border: `1px solid ${COLOR.border}`, borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
              <button onClick={handleConfirmRestore} disabled={restoring} style={{ flex: 1, padding: "8px 0", background: "#D93025", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}>{restoring ? "..." : "Replace"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- src/App.tsx ---
export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]); 
  const [materialLibrary, setMaterialLibrary] = useState<MaterialLibraryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [page, setPage] = useState<PageType>("wardrobe");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<ClothingItem | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [brandSortOpen, setBrandSortOpen] = useState<boolean>(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null);
  const [dataModalOpen, setDataModalOpen] = useState<boolean>(false);
  
  const [filters, setFilters] = useState<FilterState>({ category: [], season: [], brands: [], favoriteOnly: false });
  const [sorts, setSorts] = useState<SortState[]>([]);
  const [brandSorts, setBrandSorts] = useState<SortState[]>([{ key: "itemsCount", dir: "desc" }]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Gallery Card Size Slider State
  const [gallerySize, setGallerySize] = useState<number>(200);

  const runAutoDelete = useCallback(async (currentItems: ClothingItem[], days: number | null) => {
    if (days === null) return;
    const now = Date.now();
    const threshold = days * 24 * 3600 * 1000;
    
    const toDelete = currentItems.filter(it => 
      it.deleted && it.deletedAt && (now - new Date(it.deletedAt).getTime() > threshold)
    );
    
    if (toDelete.length > 0) {
      setItems(prev => prev.filter(it => !toDelete.some(del => del.id === it.id)));
      for (const item of toDelete) {
        await storeDelete(`item:${item.id}`);
        const allRefs = await storeListLoad<ReferenceImage>("reference:");
        allRefs.filter(r => r.itemId === item.id).forEach(r => storeDelete(`reference:${r.id}`));
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      const savedGallerySize = localStorage.getItem("wardrobe_gallery_size");
      if (savedGallerySize) setGallerySize(Number(savedGallerySize));

      const savedAutoDelete = localStorage.getItem("wardrobe_auto_delete_days");
      const parsedAutoDeleteDays = savedAutoDelete === "null" || !savedAutoDelete ? null : Number(savedAutoDelete);
      setAutoDeleteDays(parsedAutoDeleteDays);

      const seededFlagV6 = await storeGet("meta:seeded_v6_addedAt");
      const seededFlagV5 = await storeGet("meta:seeded_v5_materials");
      const seededFlagV4 = await storeGet("meta:seeded_v4");
      const seededFlagV3 = await storeGet("meta:seeded_v3");
      let loadedItems = await storeListLoad<ClothingItem>("item:");
      let loadedBrands = await storeListLoad<Brand>("brand:");
      let loadedMaterials = await storeListLoad<MaterialLibraryItem>("material:");
      let loadedSales = await storeListLoad<SaleRecord>("sale:");

      if (seededFlagV3 !== "true") {
        if (loadedItems.length === 0) {
          loadedItems = initialItems;
          for (const it of loadedItems) await storeSet(`item:${it.id}`, JSON.stringify(it));
        }
        const brandNameToId: Record<string, string> = {};
        const migratedBrands: Brand[] = [];

        for (const b of loadedBrands) {
          let brandId = b.id;
          if (!brandId) {
            brandId = crypto.randomUUID();
            await storeDelete(`brand:${b.name}`);
            b.id = brandId;
          }
          brandNameToId[b.name] = brandId;
          migratedBrands.push(b);
          await storeSet(`brand:${brandId}`, JSON.stringify(b));
        }

        for (const it of loadedItems) {
          const legacyIt = it as any;
          const bName = it.brandName || legacyIt.brand;
          if (bName && !brandNameToId[bName]) {
            const newId = crypto.randomUUID();
            brandNameToId[bName] = newId;
            const newBrand: Brand = {
              id: newId,
              name: bName,
              tier: legacyIt.tier || BRAND_TIERS[5], 
              logo: legacyIt.brandLogo || "",
              memo: localStorage.getItem(`brand_memo_${bName}`) || "",
              favorite: false,
              color: "#B8B8B8"
            };
            migratedBrands.push(newBrand);
            await storeSet(`brand:${newId}`, JSON.stringify(newBrand));
          }
        }

        for (const it of loadedItems) {
          const legacyIt = it as any;
          const bName = it.brandName || legacyIt.brand;
          if (bName) {
            it.brandId = brandNameToId[bName];
            it.brandName = bName;
          } else {
            it.brandId = "";
            it.brandName = "";
          }
          delete legacyIt.brand; 
          delete legacyIt.brandLogo;
          delete legacyIt.tier;
          await storeSet(`item:${it.id}`, JSON.stringify(it));
        }

        loadedBrands = migratedBrands;
        await storeSet("meta:seeded_v3", "true");
      }

      if (seededFlagV4 !== "true") {
        for (const it of loadedItems) {
          const legacyIt = it as any;
          if (legacyIt.references && Array.isArray(legacyIt.references)) {
            for (let i = 0; i < legacyIt.references.length; i++) {
              const oldRef = legacyIt.references[i];
              const newRef: ReferenceImage = {
                id: oldRef.id || crypto.randomUUID(),
                itemId: it.id,
                image: oldRef.src || oldRef.image,
                memo: oldRef.memo || "",
                order: i,
                createdAt: Date.now()
              };
              await storeSet(`reference:${newRef.id}`, JSON.stringify(newRef));
            }
            delete legacyIt.references;
            await storeSet(`item:${it.id}`, JSON.stringify(it));
          }
        }
        await storeSet("meta:seeded_v4", "true");
        loadedItems = await storeListLoad<ClothingItem>("item:");
      }

      if (seededFlagV5 !== "true") {
        if (loadedMaterials.length === 0) {
          loadedMaterials = INITIAL_MATERIALS_LIBRARY;
          for (const m of loadedMaterials) await storeSet(`material:${m.id}`, JSON.stringify(m));
        }

        for (const it of loadedItems) {
          let changed = false;
          if (it.materials && Array.isArray(it.materials)) {
            it.materials = it.materials.map(m => {
              const lower = m.name.trim().toLowerCase();
              const match = loadedMaterials.find(mat => mat.name.toLowerCase() === lower || (mat.aliases || []).some(a => a.toLowerCase() === lower));
              if (match && match.name !== m.name) {
                changed = true;
                return { ...m, name: match.name };
              }
              return m;
            });

            for (const m of it.materials) {
              const lower = m.name.trim().toLowerCase();
              const match = loadedMaterials.find(mat => mat.name.toLowerCase() === lower || (mat.aliases || []).some(a => a.toLowerCase() === lower));
              if (!match) {
                 const newMat: MaterialLibraryItem = { id: crypto.randomUUID(), name: m.name.trim(), aliases: [] };
                 loadedMaterials.push(newMat);
                 await storeSet(`material:${newMat.id}`, JSON.stringify(newMat));
              }
            }
          }
          if (changed) {
             await storeSet(`item:${it.id}`, JSON.stringify(it));
          }
        }
        await storeSet("meta:seeded_v5_materials", "true");
      }

      if (seededFlagV6 !== "true") {
        const now = Date.now();
        for (const it of loadedItems) {
          if (!it.addedAt) {
            it.addedAt = now;
            await storeSet(`item:${it.id}`, JSON.stringify(it));
          }
        }
        await storeSet("meta:seeded_v6_addedAt", "true");
      }

      setItems(loadedItems);
      setBrands(loadedBrands);
      setMaterialLibrary(loadedMaterials);
      setSales(loadedSales);
      setLoading(false);
      
      runAutoDelete(loadedItems, parsedAutoDeleteDays);
    })();
  }, [runAutoDelete]);

  useEffect(() => {
    if (page === "trash") {
      runAutoDelete(items, autoDeleteDays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); 

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleGallerySizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setGallerySize(val);
    localStorage.setItem("wardrobe_gallery_size", val.toString());
  }, []);

  const handleAutoDeleteChange = useCallback((days: number | null) => {
    setAutoDeleteDays(days);
    localStorage.setItem("wardrobe_auto_delete_days", String(days));
    runAutoDelete(items, days);
  }, [items, runAutoDelete]);

  const addBrand = (b: Brand) => {
    setBrands((prev) => [...prev, b]);
    storeSet(`brand:${b.id}`, JSON.stringify(b));
  };

  const updateBrand = useCallback((updated: Brand) => {
    setBrands((prev) => {
      const oldBrand = prev.find(b => b.id === updated.id);
      const nameChanged = oldBrand && oldBrand.name !== updated.name;

      if (nameChanged) {
        setItems(prevItems => {
          let hasChanges = false;
          const nextItems = prevItems.map(it => {
            if (it.brandId === updated.id) {
              hasChanges = true;
              const newIt = { ...it, brandName: updated.name };
              storeSet(`item:${newIt.id}`, JSON.stringify(newIt));
              return newIt;
            }
            return it;
          });
          return hasChanges ? nextItems : prevItems;
        });
      }

      storeSet(`brand:${updated.id}`, JSON.stringify(updated));
      return prev.map(b => b.id === updated.id ? updated : b);
    });
  }, []);

  const addMaterialToLibrary = useCallback((newMat: MaterialLibraryItem) => {
    setMaterialLibrary(prev => [...prev, newMat]);
    storeSet(`material:${newMat.id}`, JSON.stringify(newMat));
  }, []);

  const handleNavigatePage = useCallback((p: PageType) => {
    setSelected(null);
    setSelectedBrandId(null);
    setAddOpen(false);
    setSortOpen(false);
    setBrandSortOpen(false);
    setFilterOpen(false);
    setPage(p);
  }, []);

  const enrichedItems = useMemo(() => {
    return items.map(it => {
      const matchedBrand = brands.find(b => b.id === it.brandId);
      return { 
        ...it, 
        brandInfo: matchedBrand || { id: it.brandId, name: it.brandName, tier: "보세", logo: "", memo: "", favorite: false, color: "#B8B8B8" } 
      };
    });
  }, [items, brands]);

  const activeEnrichedItems = useMemo(() => enrichedItems.filter(i => !i.deleted), [enrichedItems]);
  const trashEnrichedItems = useMemo(() => 
    enrichedItems.filter(i => i.deleted)
                 .sort((a,b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()), 
  [enrichedItems]);

  const materialFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    activeEnrichedItems.forEach(it => {
      (it.materials || []).forEach(m => {
        freq[m.name] = (freq[m.name] || 0) + 1;
      });
    });
    return freq;
  }, [activeEnrichedItems]);

  const brandsWithStats: BrandWithStats[] = useMemo(() => {
    const list = brands.map(b => {
      const bItems = activeEnrichedItems.filter(it => it.brandId === b.id);
      const total = bItems.reduce((sum, i) => sum + Number(i.purchasePrice || 0), 0);
      const latestAddedAt = bItems.length > 0 ? Math.max(...bItems.map(i => Number(i.addedAt) || 0)) : 0;
      return { ...b, items: bItems, total, latestAddedAt };
    });

    list.sort((a, b) => {
      for (const s of brandSorts) {
        let av: any;
        let bv: any;

        if (s.key === "name") {
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
        } else if (s.key === "itemsCount") {
          av = a.items.length;
          bv = b.items.length;
        } else if (s.key === "totalSpending") {
          av = a.total;
          bv = b.total;
        } else if (s.key === "favorite") {
          av = a.favorite ? 1 : 0;
          bv = b.favorite ? 1 : 0;
        }

        if (av < bv) return s.dir === "asc" ? -1 : 1;
        if (av > bv) return s.dir === "asc" ? 1 : -1;
      }

      if (b.latestAddedAt !== a.latestAddedAt) {
          return b.latestAddedAt - a.latestAddedAt;
      }
      return b.items.length - a.items.length;
    });

    return list;
  }, [brands, activeEnrichedItems, brandSorts]);

  const availableBrands = useMemo(() => {
    const usedBrandIds = new Set(activeEnrichedItems.map(i => i.brandId).filter(Boolean));
    return brands.filter(b => usedBrandIds.has(b.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeEnrichedItems, brands]);

  const filtered = useMemo(() => {
    let list = [...activeEnrichedItems];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    
    if (terms.length) {
      list = list.filter((it) => {
        const haystack = [it.brandName, it.name, it.memo || ""].join(" ").toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    }
    
    if (filters.category.length) list = list.filter((it) => filters.category.includes(it.category as Category));
    if (filters.season.length) list = list.filter((it) => filters.season.some((s) => it.seasons.includes(s)));
    if (filters.brands.length) list = list.filter((it) => filters.brands.includes(it.brandId));
    if (filters.favoriteOnly) list = list.filter((it) => it.favorite);

    if (sorts.length) {
      list.sort((a, b) => {
        for (const s of sorts) {
          let av = (a as any)[s.key], bv = (b as any)[s.key];
          if (s.key === "purchaseDate") { av = new Date(av).getTime() || 0; bv = new Date(bv).getTime() || 0; }
          if (s.key === "addedAt") { av = Number(av) || 0; bv = Number(bv) || 0; }
          if (s.key === "seasons") { av = (av || []).join(","); bv = (bv || []).join(","); }
          if (av < bv) return s.dir === "asc" ? -1 : 1;
          if (av > bv) return s.dir === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return list;
  }, [activeEnrichedItems, query, filters, sorts]);

  const toggleFilter = useCallback(<K extends keyof FilterState>(key: K, val: any) => {
    setFilters((f) => {
      const set = new Set<any>(f[key] as any[]);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...f, [key]: Array.from(set) };
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setItems((all) => {
      const next = all.map((i) => i.id === id ? { ...i, favorite: !i.favorite } : i);
      const changed = next.find((i) => i.id === id);
      if (changed) storeSet(`item:${id}`, JSON.stringify(changed));
      return next;
    });
  }, []);

  const saveItem = useCallback((draft: ClothingItem) => {
    setItems((all) => all.map((i) => i.id === draft.id ? draft : i));
    storeSet(`item:${draft.id}`, JSON.stringify(draft));
  }, []);

  const deleteItem = async (id: string, reason?: string, price?: number | "", date?: string) => {
    const now = new Date().toISOString();
    
    if (reason === "판매" && price !== "" && price !== undefined) {
       const targetItem = items.find(i => i.id === id);
       if (targetItem) {
          const newSale: SaleRecord = {
             id: crypto.randomUUID(),
             itemId: id,
             brandName: targetItem.brandName,
             name: targetItem.name,
             soldPrice: Number(price),
             soldDate: date || now.split('T')[0],
             createdAt: Date.now()
          };
          setSales(prev => [...prev, newSale]);
          storeSet(`sale:${newSale.id}`, JSON.stringify(newSale));
       }
    }
    
    setItems((all) => {
      const next = all.map(i => i.id === id ? { 
        ...i, 
        deleted: true, 
        deletedAt: now,
        deletionReason: reason || null,
        soldPrice: price || null,
        soldDate: date || null
      } : i);
      const changed = next.find(i => i.id === id);
      if (changed) storeSet(`item:${id}`, JSON.stringify(changed));
      return next;
    });
    
    setSelected(null);
  };
  
  const restoreItem = async (id: string) => {
    setItems((all) => {
      const next = all.map(i => i.id === id ? { 
        ...i, 
        deleted: false, 
        deletedAt: null,
        deletionReason: null,
        soldPrice: null,
        soldDate: null 
      } : i);
      const changed = next.find(i => i.id === id);
      if (changed) storeSet(`item:${id}`, JSON.stringify(changed));
      return next;
    });
  };

  const hardDeleteItem = async (id: string) => {
    setItems((all) => all.filter((i) => i.id !== id));
    await storeDelete(`item:${id}`);
    
    const allRefs = await storeListLoad<ReferenceImage>("reference:");
    allRefs.filter(r => r.itemId === id).forEach(r => storeDelete(`reference:${r.id}`));
  };

  const restoreAll = useCallback(() => {
    setItems((all) => {
      const next = all.map(i => i.deleted ? { 
        ...i, 
        deleted: false, 
        deletedAt: null,
        deletionReason: null,
        soldPrice: null,
        soldDate: null
      } : i);
      next.forEach(i => {
         if (all.find(old => old.id === i.id)?.deleted) {
            storeSet(`item:${i.id}`, JSON.stringify(i));
         }
      });
      return next;
    });
  }, []);

  const emptyTrash = useCallback(async () => {
    const toDelete = items.filter(i => i.deleted);
    setItems(all => all.filter(i => !i.deleted));
    for (const item of toDelete) {
      await storeDelete(`item:${item.id}`);
      const allRefs = await storeListLoad<ReferenceImage>("reference:");
      allRefs.filter(r => r.itemId === item.id).forEach(r => storeDelete(`reference:${r.id}`));
    }
  }, [items]);

  const addItem = (form: ClothingItem) => {
    const newItem = { ...form }; 
    setItems((all) => [newItem, ...all]);
    storeSet(`item:${newItem.id}`, JSON.stringify(newItem));
    setAddOpen(false);
  };

  const activeFilterCount = filters.category.length + filters.season.length + filters.brands.length + (filters.favoriteOnly ? 1 : 0);

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
        fontFamily: "'Inter','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif",
        color: COLOR.subtext, fontSize: 13.5, background: COLOR.bg,
      }}>
        ...
      </div>
    );
  }

  const activeBrandEntity = brands.find(b => b.id === selectedBrandId);

  return (
    <div style={{ display: "flex", fontFamily: "'Inter','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif", background: COLOR.bg, color: COLOR.text, minHeight: "100vh" }}>
      <style>{`
        @keyframes simpleFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-tab {
          animation: simpleFade 0.25s ease-in-out;
        }
        .minimal-slider {
          -webkit-appearance: none;
          background: transparent;
        }
        .minimal-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: ${COLOR.text};
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.15s ease;
        }
        .minimal-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 2px;
          cursor: pointer;
          background: ${COLOR.border};
        }
        .minimal-slider:focus::-webkit-slider-thumb {
          transform: scale(1.2);
        }
      `}</style>
      
      <Sidebar page={page} setPage={handleNavigatePage} count={activeEnrichedItems.length} onOpenData={() => setDataModalOpen(true)} />

      <div style={{ flex: 1, width: "100%", padding: "26px 40px 60px", boxSizing: "border-box" }}>
        {page === "wardrobe" && (
          <WardrobePage 
            query={query} setQuery={setQuery} searchRef={searchRef}
            sortOpen={sortOpen} setSortOpen={setSortOpen} sorts={sorts} setSorts={setSorts}
            viewMode={viewMode} setViewMode={setViewMode} 
            gallerySize={gallerySize} handleGallerySizeChange={handleGallerySizeChange}
            setAddOpen={setAddOpen}
            filterOpen={filterOpen} setFilterOpen={setFilterOpen} 
            activeFilterCount={activeFilterCount} filters={filters} setFilters={setFilters}
            brands={brands} availableBrands={availableBrands} toggleFilter={toggleFilter}
            filtered={filtered} setSelected={setSelected} toggleFavorite={toggleFavorite}
          />
        )}
        {page === "brands" && (
          <BrandsPage 
            brandsWithStats={brandsWithStats} 
            onSelectBrand={(b) => setSelectedBrandId(b.id)} 
            sorts={brandSorts}
            setSorts={setBrandSorts}
            sortOpen={brandSortOpen}
            setSortOpen={setBrandSortOpen}
          />
        )}
        {page === "stats" && <StatisticsPage items={activeEnrichedItems} brands={brands} sales={sales} />}
        {page === "calendar" && <CalendarPage items={activeEnrichedItems} brands={brands} onOpenItem={setSelected} />}
        {page === "trash" && <TrashPage items={trashEnrichedItems} onRestore={restoreItem} onHardDelete={hardDeleteItem} onRestoreAll={restoreAll} onEmptyTrash={emptyTrash} autoDeleteDays={autoDeleteDays} onAutoDeleteChange={handleAutoDeleteChange} />}
      </div>

      {selected && <Drawer item={selected} onClose={() => setSelected(null)} onSave={saveItem} onDelete={deleteItem} brands={brands} onAddBrand={addBrand} materialLibrary={materialLibrary} onAddMaterialToLibrary={addMaterialToLibrary} materialFreq={materialFreq} />}
      
      {activeBrandEntity && (
        <BrandDrawer 
          brand={activeBrandEntity} 
          onClose={() => setSelectedBrandId(null)} 
          onUpdateBrand={updateBrand}
          items={activeEnrichedItems}
          onViewInWardrobe={(brandId) => {
            setFilters(f => ({ ...f, brands: [brandId] }));
            setPage("wardrobe");
            setSelectedBrandId(null);
          }}
        />
      )}
      
      {addOpen && <AddModal onClose={() => setAddOpen(false)} onAdd={addItem} brands={brands} onAddBrand={addBrand} materialLibrary={materialLibrary} onAddMaterialToLibrary={addMaterialToLibrary} materialFreq={materialFreq} />}
      
      {dataModalOpen && <DataModal onClose={() => setDataModalOpen(false)} />}
    </div>
  );
}