import React, { useEffect, useRef } from "react";
import {
  Search, SlidersHorizontal, ArrowUpDown, LayoutGrid, Rows3, Plus, Heart, Command, Square,
} from "lucide-react";
import type { ViewMode } from "../types/common";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import { COLOR } from "../constants/design";
import {
  ActiveChip,
  EmptyState,
  IconBtn,
  PageHeader,
  inputStyle,
} from "../components/common";
import { FilterPopover } from "../components/FilterPopover";
import type { FilterState } from "../components/FilterPopover";
import { CLOTHING_SORT_FIELDS, SortPanel } from "../components/SortPanel";
import type { SortState } from "../components/SortPanel";
import { ClothingCard } from "../components/ClothingCard";
import { TableView } from "../components/TableView";

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
export function WardrobePage({
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
