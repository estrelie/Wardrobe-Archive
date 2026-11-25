import React from "react";
import { X } from "lucide-react";
import { COLOR } from "../constants/design";
import { Select } from "./common";

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

interface SortField {
  key: string;
  label: string;
}

export const CLOTHING_SORT_FIELDS: SortField[] = [
  { key: "addedAt", label: "Date Added" }, 
  { key: "brandName", label: "Brand" },
  { key: "seasons", label: "Season" },
  { key: "purchaseDate", label: "Purchase Date" },
  { key: "price", label: "Retail Price" },
];

export const BRAND_SORT_FIELDS: SortField[] = [
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
export function SortPanel({ sorts, setSorts, fields, defaultKey }: SortPanelProps) {
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
