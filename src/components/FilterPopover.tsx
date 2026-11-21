import React from "react";
import type { Category, Season } from "../types/common";
import type { Brand } from "../types/brand";
import { CATEGORIES, COLOR, SEASONS } from "../constants/design";

/* ---------------------------------------------------------
   New Minimal Filter Panel (Popover)
--------------------------------------------------------- */
export interface FilterState {
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
export function FilterPopover({ filters, setFilters, availableBrands }: FilterPopoverProps) {
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
