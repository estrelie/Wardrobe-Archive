import React from "react";
import {
  Trash2, BarChart3, Shirt, Tag, Calendar as CalendarIcon, Database,
} from "lucide-react";
import type { PageType } from "../types/common";
import { COLOR } from "../constants/design";

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
export function Sidebar({ page, setPage, count, onOpenData }: SidebarProps) {
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
