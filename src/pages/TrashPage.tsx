import { useState, useEffect } from "react";
import type { ClothingItem } from "../types/clothing";
import { COLOR } from "../constants/design";
import { EmptyState, PageHeader, Select } from "../components/common";
import { ClothingCard } from "../components/ClothingCard";

// --- src/pages/TrashPage.tsx ---
interface TrashPageProps {
  items: ClothingItem[];
  onRestore: (id: string) => void;
  /** removeFromHistory: true면 캘린더의 구매 기록도 함께 지운다 */
  onHardDelete: (id: string, removeFromHistory: boolean) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
  autoDeleteDays: number | null;
  onAutoDeleteChange: (days: number | null) => void;
}

export function TrashPage({ items, onRestore, onHardDelete, onRestoreAll, onEmptyTrash, autoDeleteDays, onAutoDeleteChange }: TrashPageProps) {
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ClothingItem | null>(null);
  const [alsoRemoveHistory, setAlsoRemoveHistory] = useState(false);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPendingDelete(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete]);

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
                <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 14 }}>This action cannot be undone. Purchase records stay in the Calendar.</div>
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
                <button onClick={() => { setAlsoRemoveHistory(false); setPendingDelete(item); }} style={{ flex: 1, padding: "8px 0", fontSize: 12.5, background: COLOR.bg, color: "#D93025", border: `1px solid #FCE8E6`, borderRadius: 6, cursor: "pointer" }}>Delete Permanently</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: COLOR.subtext, textAlign: "center" }}>
                Deleted: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          onClick={() => setPendingDelete(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 340, background: COLOR.bg, borderRadius: 10, border: `1px solid ${COLOR.border}`, padding: "22px", boxShadow: "0 18px 48px rgba(0,0,0,.12)" }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: "center", color: COLOR.text, marginBottom: 10 }}>
              Delete this item permanently?
            </div>
            <div style={{ fontSize: 12, textAlign: "center", color: COLOR.subtext, lineHeight: 1.6, marginBottom: pendingDelete.purchaseDate ? 14 : 22 }}>
              Its photos and details will be removed. This can't be undone.
              {pendingDelete.purchaseDate && (
                <div style={{ marginTop: 6 }}>
                  {alsoRemoveHistory ? "Its purchase record will be removed too." : "Its purchase record stays in the Calendar."}
                </div>
              )}
            </div>
            {pendingDelete.purchaseDate && (
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, color: COLOR.text, marginBottom: 22, cursor: "pointer" }}>
                <input type="checkbox" checked={alsoRemoveHistory} onChange={(e) => setAlsoRemoveHistory(e.target.checked)} />
                Also remove it from purchase history
              </label>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPendingDelete(null)}
                style={{ flex: 1, height: 36, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onHardDelete(pendingDelete.id, !!pendingDelete.purchaseDate && alsoRemoveHistory); setPendingDelete(null); }}
                style={{ flex: 1, height: 36, background: "#ECECEC", border: "1px solid #D9D9D9", borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
