import { useState } from "react";
import type { ClothingItem } from "../types/clothing";
import { COLOR } from "../constants/design";
import { EmptyState, PageHeader, Select } from "../components/common";
import { ClothingCard } from "../components/ClothingCard";

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

export function TrashPage({ items, onRestore, onHardDelete, onRestoreAll, onEmptyTrash, autoDeleteDays, onAutoDeleteChange }: TrashPageProps) {
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
