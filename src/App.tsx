import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from "react";
import type { Category, PageType, ViewMode } from "./types/common";
import type { MaterialLibraryItem } from "./types/material";
import type { ReferenceImage } from "./types/reference";
import type { Brand, BrandWithStats } from "./types/brand";
import type { ClothingItem } from "./types/clothing";
import type { SaleRecord } from "./types/sale";
import type { PurchaseRecord } from "./types/purchase";
import { BRAND_TIERS, COLOR } from "./constants/design";
import { INITIAL_MATERIALS_LIBRARY } from "./constants/materials";
import {
  STORAGE_ERROR_EVENT,
  storeDelete,
  storeGet,
  storeListLoad,
  storeSet,
} from "./lib/storage";
import { initialItems } from "./lib/seed";
import { findBrandByName } from "./lib/brandName";
import { planBrandRelink } from "./lib/brandLink";
import { makeThumbnail } from "./lib/image";
import { buildPurchaseEntries, recordFromItem } from "./lib/purchaseLog";
import type { FilterState } from "./components/FilterPopover";
import type { SortState } from "./components/SortPanel";
import { Drawer } from "./components/ClothingDrawer";
import { AddModal } from "./components/AddModal";
import { BrandDrawer } from "./components/BrandDrawer";
import { Sidebar } from "./components/Sidebar";
import { WardrobePage } from "./pages/WardrobePage";
import { BrandsPage } from "./pages/BrandsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { TrashPage } from "./pages/TrashPage";
import { DataModal } from "./components/DataModal";

// --- src/App.tsx ---
export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]); 
  const [materialLibrary, setMaterialLibrary] = useState<MaterialLibraryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
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
  const [storageNotice, setStorageNotice] = useState<"write" | "read" | null>(null);
  const [backupDue, setBackupDue] = useState<boolean>(false);
  
  const [filters, setFilters] = useState<FilterState>({ category: [], season: [], brands: [], favoriteOnly: false });
  const [sorts, setSorts] = useState<SortState[]>([]);
  const [brandSorts, setBrandSorts] = useState<SortState[]>([{ key: "itemsCount", dir: "desc" }]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Gallery Card Size Slider State
  const [gallerySize, setGallerySize] = useState<number>(200);

  /** 영구 삭제되는 옷의 구매 요약(이름·브랜드·구매일·구매가·썸네일)을 남긴다. 구매일이 없으면 남기지 않는다 */
  const savePurchaseRecord = useCallback(async (item: ClothingItem) => {
    if (!item.purchaseDate) return;
    const thumbnail = await makeThumbnail(item.images?.[0] || "");
    const record = recordFromItem(item, thumbnail);
    if (!record) return;
    setPurchaseRecords((prev) => [...prev.filter((r) => r.id !== record.id), record]);
    await storeSet(`purchase:${record.id}`, JSON.stringify(record));
  }, []);

  const removePurchaseRecord = useCallback(async (id: string) => {
    setPurchaseRecords((prev) => prev.filter((r) => r.id !== id));
    await storeDelete(`purchase:${id}`);
  }, []);

  const runAutoDelete = useCallback(async (currentItems: ClothingItem[], days: number | null) => {
    if (days === null) return;
    const now = Date.now();
    const threshold = days * 24 * 3600 * 1000;
    
    const toDelete = currentItems.filter(it => 
      it.deleted && it.deletedAt && (now - new Date(it.deletedAt).getTime() > threshold)
    );
    
    if (toDelete.length > 0) {
      // 캘린더의 구매 이력이 사라지지 않도록 지우기 전에 구매 기록을 먼저 남긴다
      for (const item of toDelete) await savePurchaseRecord(item);
      setItems(prev => prev.filter(it => !toDelete.some(del => del.id === it.id)));
      for (const item of toDelete) {
        await storeDelete(`item:${item.id}`);
        const allRefs = await storeListLoad<ReferenceImage>("reference:");
        allRefs.filter(r => r.itemId === item.id).forEach(r => storeDelete(`reference:${r.id}`));
      }
    }
  }, [savePurchaseRecord]);

  // StrictMode(개발 모드)에서는 effect가 두 번 실행되어 첫 실행 시 브랜드가 중복 생성되므로 한 번만 실행
  const initialLoadStartedRef = useRef(false);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
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
      const loadedPurchases = await storeListLoad<PurchaseRecord>("purchase:");

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

      // IndexedDB는 키(UUID) 순으로 돌려주므로, 추가한 순서대로 보이도록 정렬
      loadedItems = [...loadedItems].sort((a, b) => (Number(a.addedAt) || 0) - (Number(b.addedAt) || 0));

      // 마지막 백업(내보내기) 이후 30일이 지났으면 안내
      const lastExport = await storeGet("meta:last_export");
      let baseline = await storeGet("meta:backup_baseline");
      if (!baseline) {
        baseline = String(Date.now());
        await storeSet("meta:backup_baseline", baseline);
      }
      const backupBase = Number(lastExport) || Number(baseline);
      setBackupDue(Date.now() - backupBase > 30 * 24 * 3600 * 1000);

      // 브랜드 연결이 끊긴 항목 복구 (옷장에 있는 항목만. 휴지통 항목은 복원할 때 처리한다)
      {
        const activeItems = loadedItems.filter((i) => !i.deleted);
        const { items: relinked, newBrands } = planBrandRelink(activeItems, loadedBrands);
        const changedItems = relinked.filter((it, idx) => it !== activeItems[idx]);
        if (newBrands.length > 0 || changedItems.length > 0) {
          for (const b of newBrands) await storeSet(`brand:${b.id}`, JSON.stringify(b));
          for (const it of changedItems) await storeSet(`item:${it.id}`, JSON.stringify(it));
          const changedById = new Map(changedItems.map((i) => [i.id, i]));
          loadedItems = loadedItems.map((i) => changedById.get(i.id) ?? i);
          loadedBrands = [...loadedBrands, ...newBrands];
        }
      }

      setItems(loadedItems);
      setBrands(loadedBrands);
      setMaterialLibrary(loadedMaterials);
      setSales(loadedSales);
      setPurchaseRecords(loadedPurchases);
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
    const onStorageError = (e: Event) => {
      const action = (e as CustomEvent<{ action: string }>).detail?.action;
      setStorageNotice(action === "get" || action === "list" ? "read" : "write");
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, []);

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

  const updateBrand = useCallback((incoming: Brand) => {
    setBrands((prev) => {
      const oldBrand = prev.find(b => b.id === incoming.id);
      // 이미 삭제된 브랜드는 (서랍이 닫힐 때 대기 중이던 자동 저장으로) 되살리지 않는다
      if (!oldBrand) return prev;

      // 다른 브랜드와 이름이 겹치면(대소문자·공백 무시) 이름만 이전 값으로 유지한다
      const updated = findBrandByName(prev, incoming.name, incoming.id)
        ? { ...incoming, name: oldBrand.name }
        : incoming;
      const nameChanged = oldBrand.name !== updated.name;

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

  /** 브랜드 삭제: 옷장에 소속 옷이 없을 때만 허용 (휴지통에만 있는 옷은 복원할 때 브랜드가 다시 만들어진다) */
  const deleteBrand = useCallback((id: string) => {
    if (items.some((i) => !i.deleted && i.brandId === id)) return;
    setBrands((prev) => prev.filter((b) => b.id !== id));
    setFilters((f) => (f.brands.includes(id) ? { ...f, brands: f.brands.filter((b) => b !== id) } : f));
    setSelectedBrandId(null);
    storeDelete(`brand:${id}`);
  }, [items]);

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

  // 캘린더용 구매 기록: 옷장 + 휴지통 + 영구 삭제된 옷의 구매 기록
  const purchaseEntries = useMemo(() => buildPurchaseEntries(enrichedItems, purchaseRecords), [enrichedItems, purchaseRecords]);

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
  
  /** 복원되는 항목의 브랜드 연결을 확인하고, 브랜드가 삭제됐다면 다시 만든다 */
  const applyBrandRecovery = (restored: ClothingItem[]): ClothingItem[] => {
    const { items: fixed, newBrands } = planBrandRelink(restored, brands);
    if (newBrands.length > 0) {
      setBrands((prev) => [...prev, ...newBrands]);
      newBrands.forEach((b) => storeSet(`brand:${b.id}`, JSON.stringify(b)));
    }
    return fixed;
  };

  const restoreItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const cleared = {
      ...target,
      deleted: false,
      deletedAt: null,
      deletionReason: null,
      soldPrice: null,
      soldDate: null,
    };
    const [fixed] = applyBrandRecovery([cleared]);
    setItems((all) => all.map((i) => (i.id === id ? fixed : i)));
    storeSet(`item:${id}`, JSON.stringify(fixed));
  };

  /** removeFromHistory: true면 구매 기록도 함께 지운다. 기본은 구매 기록을 남긴다 */
  const hardDeleteItem = async (id: string, removeFromHistory: boolean = false) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      if (removeFromHistory) await removePurchaseRecord(id);
      else await savePurchaseRecord(target);
    }
    setItems((all) => all.filter((i) => i.id !== id));
    await storeDelete(`item:${id}`);
    
    const allRefs = await storeListLoad<ReferenceImage>("reference:");
    allRefs.filter(r => r.itemId === id).forEach(r => storeDelete(`reference:${r.id}`));
  };

  const restoreAll = () => {
    const trashed = items.filter((i) => i.deleted);
    if (trashed.length === 0) return;
    const cleared = trashed.map((i) => ({
      ...i,
      deleted: false,
      deletedAt: null,
      deletionReason: null,
      soldPrice: null,
      soldDate: null,
    }));
    const fixed = applyBrandRecovery(cleared);
    const fixedById = new Map(fixed.map((i) => [i.id, i]));
    setItems((all) => all.map((i) => fixedById.get(i.id) ?? i));
    fixed.forEach((i) => storeSet(`item:${i.id}`, JSON.stringify(i)));
  };

  const emptyTrash = useCallback(async () => {
    const toDelete = items.filter(i => i.deleted);
    // 비우기 전에 구매 기록을 먼저 남긴다 (캘린더의 구매 이력 유지)
    for (const item of toDelete) await savePurchaseRecord(item);
    setItems(all => all.filter(i => !i.deleted));
    for (const item of toDelete) {
      await storeDelete(`item:${item.id}`);
      const allRefs = await storeListLoad<ReferenceImage>("reference:");
      allRefs.filter(r => r.itemId === item.id).forEach(r => storeDelete(`reference:${r.id}`));
    }
  }, [items, savePurchaseRecord]);

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
        {(storageNotice || backupDue) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 14px", marginBottom: 16, borderRadius: 6, fontSize: 12.5,
            border: `1px solid ${storageNotice ? "#D93025" : COLOR.border}`,
            background: storageNotice ? "#FDECEA" : COLOR.bg2,
            color: storageNotice ? "#B3261E" : COLOR.text,
          }}>
            <span>
              {storageNotice === "write"
                ? "Some changes could not be saved. Export an archive now so nothing is lost, then reload the page."
                : storageNotice === "read"
                ? "Couldn't read your saved data. Reload the page; if it keeps happening, restore from an exported archive."
                : "It's been over 30 days since your last backup. Export an archive to keep your data safe."}
            </span>
            <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setDataModalOpen(true)} style={{ padding: "5px 10px", fontSize: 12, borderRadius: 5, cursor: "pointer", border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.text }}>Back up</button>
              <button onClick={() => { setStorageNotice(null); setBackupDue(false); }} style={{ padding: "5px 10px", fontSize: 12, borderRadius: 5, cursor: "pointer", border: "none", background: "transparent", color: "inherit" }}>Dismiss</button>
            </span>
          </div>
        )}
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
        {page === "calendar" && <CalendarPage entries={purchaseEntries} onOpenItem={setSelected} onRemoveRecord={removePurchaseRecord} />}
        {page === "trash" && <TrashPage items={trashEnrichedItems} onRestore={restoreItem} onHardDelete={hardDeleteItem} onRestoreAll={restoreAll} onEmptyTrash={emptyTrash} autoDeleteDays={autoDeleteDays} onAutoDeleteChange={handleAutoDeleteChange} />}
      </div>

      {selected && <Drawer item={selected} onClose={() => setSelected(null)} onSave={saveItem} onDelete={deleteItem} brands={brands} onAddBrand={addBrand} materialLibrary={materialLibrary} onAddMaterialToLibrary={addMaterialToLibrary} materialFreq={materialFreq} />}
      
      {activeBrandEntity && (
        <BrandDrawer 
          brand={activeBrandEntity} 
          onClose={() => setSelectedBrandId(null)} 
          onUpdateBrand={updateBrand}
          onDeleteBrand={deleteBrand}
          trashedItemCount={items.filter((i) => i.deleted && i.brandId === activeBrandEntity.id).length}
          otherBrandNames={brands.filter((b) => b.id !== activeBrandEntity.id).map((b) => b.name)}
          items={activeEnrichedItems}
          onViewInWardrobe={(brandId) => {
            setFilters(f => ({ ...f, brands: [brandId] }));
            setPage("wardrobe");
            setSelectedBrandId(null);
          }}
        />
      )}
      
      {addOpen && <AddModal onClose={() => setAddOpen(false)} onAdd={addItem} brands={brands} onAddBrand={addBrand} materialLibrary={materialLibrary} onAddMaterialToLibrary={addMaterialToLibrary} materialFreq={materialFreq} />}
      
      {dataModalOpen && <DataModal onClose={() => setDataModalOpen(false)} onExported={() => { setBackupDue(false); setStorageNotice(null); }} />}
    </div>
  );
}
