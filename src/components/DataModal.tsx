import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import type { MaterialLibraryItem } from "../types/material";
import type { ReferenceImage } from "../types/reference";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import type { ArchiveData, SaleRecord } from "../types/sale";
import type { PurchaseRecord } from "../types/purchase";
import { COLOR } from "../constants/design";
import { storeReplacePrefixes, storeSet } from "../lib/storage";
import { archiveFileName, buildArchive, currentCounts, downloadJson } from "../lib/archive";
import type { ArchiveCounts } from "../lib/archive";
import { sanitizeBrand, sanitizeItem, sanitizeList } from "../lib/sanitize";
import { parseAutoDeleteDays } from "../lib/settings";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const describe = (c: { items: number; brands: number; purchases: number | null }) =>
  `${plural(c.items, "item", "items")} · ${plural(c.brands, "brand", "brands")} · ${c.purchases === null ? "—" : plural(c.purchases, "purchase record", "purchase records")}`;

// --- Data Modal Component ---
interface DataModalProps {
  onClose: () => void;
  onExported?: () => void;
}

export function DataModal({ onClose, onExported }: DataModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmData, setConfirmData] = useState<ArchiveData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [counts, setCounts] = useState<ArchiveCounts | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [backupFirst, setBackupFirst] = useState(true);

  const handleExport = async () => {
    try {
      const archive = await buildArchive();
      downloadJson(archive, archiveFileName());
      if (archive.items.length > 0) {
        await storeSet("meta:last_export", String(Date.now()));
        onExported?.();
      }
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
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version !== 1 || !Array.isArray(json.items) || !Array.isArray(json.brands)) {
          setErrorMsg("Invalid archive file.");
          return;
        }
        // 읽을 수 없는 레코드는 건너뛰고, 빠진 칸은 기본값으로 채워서 가져온다
        const si = sanitizeList(json.items, sanitizeItem);
        const sb = sanitizeList(json.brands, sanitizeBrand);
        setSkipped(si.skipped + sb.skipped);
        setCounts(await currentCounts());
        setBackupFirst(true);
        setConfirmData({ ...json, items: si.items, brands: sb.items });
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
    if (backupFirst) {
      try {
        downloadJson(await buildArchive(), archiveFileName("_before-import"));
      } catch {
        setErrorMsg("Couldn't back up your current data, so nothing was changed.");
        setRestoring(false);
        return;
      }
    }
    try {
      // 구매 기록이 들어 있지 않은 예전 백업 파일을 가져올 때는 지금 있는 구매 기록을 지우지 않는다
      const hasPurchases = Array.isArray(confirmData.purchases);
      const prefixes = ["item:", "brand:", "material:", "reference:", "sale:", ...(hasPurchases ? ["purchase:"] : [])];
      const entries: [string, string][] = [
        ...(confirmData.items || []).map((x: ClothingItem): [string, string] => [`item:${x.id}`, JSON.stringify(x)]),
        ...(confirmData.brands || []).map((x: Brand): [string, string] => [`brand:${x.id}`, JSON.stringify(x)]),
        ...(confirmData.materials || []).map((x: MaterialLibraryItem): [string, string] => [`material:${x.id}`, JSON.stringify(x)]),
        ...(confirmData.references || []).map((x: ReferenceImage): [string, string] => [`reference:${x.id}`, JSON.stringify(x)]),
        ...(confirmData.sales || []).map((x: SaleRecord): [string, string] => [`sale:${x.id}`, JSON.stringify(x)]),
        ...(confirmData.purchases || []).map((x: PurchaseRecord): [string, string] => [`purchase:${x.id}`, JSON.stringify(x)]),
      ];
      await storeReplacePrefixes(prefixes, entries);

      if (confirmData.settings) {
        if (confirmData.settings.gallerySize) localStorage.setItem("wardrobe_gallery_size", confirmData.settings.gallerySize.toString());
        if (confirmData.settings.autoDeleteDays !== undefined) localStorage.setItem("wardrobe_auto_delete_days", String(parseAutoDeleteDays(confirmData.settings.autoDeleteDays)));
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
            <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 12 }}>Current data will be overwritten.</div>
            {counts && (
              <div style={{ fontSize: 12, color: COLOR.text, lineHeight: 1.7, marginBottom: 12 }}>
                <div><span style={{ display: "inline-block", width: 52, color: COLOR.subtext }}>Current</span>{describe(counts)}</div>
                <div><span style={{ display: "inline-block", width: 52, color: COLOR.subtext }}>File</span>{describe({ items: confirmData.items.length, brands: confirmData.brands.length, purchases: Array.isArray(confirmData.purchases) ? confirmData.purchases.length : null })}</div>
              </div>
            )}
            {counts && confirmData.items.length < counts.items && (
              <div style={{ fontSize: 12, color: "#B3261E", lineHeight: 1.5, marginBottom: 12 }}>
                This file has fewer items than your current archive.
              </div>
            )}
            {skipped > 0 && (
              <div style={{ fontSize: 12, color: COLOR.subtext, lineHeight: 1.5, marginBottom: 12 }}>
                {plural(skipped, "damaged record", "damaged records")} in the file will be skipped.
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLOR.text, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={backupFirst} onChange={(e) => setBackupFirst(e.target.checked)} disabled={restoring} />
              Download a backup of the current data first
            </label>
            {errorMsg && <div style={{ fontSize: 12, color: "#D93025", marginBottom: 12 }}>{errorMsg}</div>}
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
