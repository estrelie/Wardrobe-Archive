import type { ClothingItem } from "../types/clothing";
import { COLOR } from "../constants/design";
import { fmtWon } from "../lib/format";

/* ---------------------------------------------------------
   Table view
--------------------------------------------------------- */
interface TableViewProps {
  items: ClothingItem[];
  onOpen: (item: ClothingItem) => void;
}
export function TableView({ items, onOpen }: TableViewProps) {
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
