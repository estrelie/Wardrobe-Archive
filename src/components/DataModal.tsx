import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import type { MaterialLibraryItem } from "../types/material";
import type { ReferenceImage } from "../types/reference";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import type { ArchiveData, SaleRecord } from "../types/sale";
import type { PurchaseRecord } from "../types/purchase";
import { COLOR } from "../constants/design";
import { storeListLoad, storeReplacePrefixes, storeSet } from "../lib/storage";

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

  const handleExport = async () => {
    try {
      const items = await storeListLoad<ClothingItem>("item:");
      const brands = await storeListLoad<Brand>("brand:");
      const materials = await storeListLoad<MaterialLibraryItem>("material:");
      const references = await storeListLoad<ReferenceImage>("reference:");
      const sales = await storeListLoad<SaleRecord>("sale:");
      const purchases = await storeListLoad<PurchaseRecord>("purchase:");

      const archive: ArchiveData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items,
        brands,
        materials,
        references,
        sales,
        purchases,
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
      if (items.length > 0) {
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
