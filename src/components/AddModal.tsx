import React, { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { BrandTier } from "../types/common";
import type { MaterialLibraryItem } from "../types/material";
import type { ReferenceImage } from "../types/reference";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import { BRAND_TIERS, CATEGORIES, COLOR } from "../constants/design";
import { CATEGORY_SIZE_TYPE, getSizeOptions } from "../constants/sizing";
import { storeDelete, storeListLoad } from "../lib/storage";
import { seedItem } from "../lib/seed";
import { Field, MediaTabs, Select, TextInput } from "./common";
import { SeasonPicker } from "./SeasonPicker";
import { BrandInput, FormBrandSection } from "./BrandFields";
import { MaterialsEditor } from "./MaterialsEditor";
import { ImageManager } from "./ImageManager";
import { ReferenceManager } from "./ReferenceBoard";

interface AddModalProps {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
export function AddModal({ onClose, onAdd, brands, onAddBrand, materialLibrary, onAddMaterialToLibrary, materialFreq }: AddModalProps) {
  const [form, setForm] = useState<ClothingItem>(seedItem({}));
  const [mediaTab, setMediaTab] = useState("photos");
  const [newBrandTier, setNewBrandTier] = useState<BrandTier | string>(BRAND_TIERS[5]); 
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const initialFormRef = useRef(form);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialFormRef.current), [form]);

  // Unsaved Protection: Window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  
  const set = (k: keyof ClothingItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setField = (k: keyof ClothingItem, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    let targetBrandId = "";
    const matchedBrand = brands.find(b => b.name === form.brandName);
    if (form.brandName) {
      if (matchedBrand) {
        targetBrandId = matchedBrand.id;
      } else {
        targetBrandId = crypto.randomUUID();
        onAddBrand({
          id: targetBrandId,
          name: form.brandName,
          tier: newBrandTier,
          logo: newBrandLogo,
          memo: "",
          favorite: false,
          color: "#B8B8B8"
        });
      }
    }
    const toSave: Partial<ClothingItem> = { ...form, brandId: targetBrandId, addedAt: Date.now() };
    delete toSave.brandInfo; 
    onAdd(toSave as ClothingItem);
  };

  const handleCancel = () => {
    storeListLoad<ReferenceImage>("reference:").then(allRefs => {
      allRefs.filter(r => r.itemId === form.id).forEach(r => storeDelete(`reference:${r.id}`));
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(17,17,17,0.32)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={handleCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
        background: COLOR.bg, borderRadius: 10, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>Add Item</span>
          <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} color={COLOR.subtext} />
          </button>
        </div>

        <div style={{ marginBottom: 32, minHeight: 200 }}>
          <MediaTabs active={mediaTab} onChange={setMediaTab} />
          {mediaTab === "photos" && (
            <ImageManager images={form.images} onChange={(imgs) => setField("images", imgs)} />
          )}
          {mediaTab === "reference" && (
            <ReferenceManager itemId={form.id} />
          )}
        </div>

        <Field label="Brand">
          <BrandInput value={form.brandName} onChange={(v) => setField("brandName", v)} brands={brands.map(b => b.name)} />
          <FormBrandSection 
            formBrandName={form.brandName} brands={brands} 
            newTier={newBrandTier} setNewTier={setNewBrandTier} 
            newLogo={newBrandLogo} setNewLogo={setNewBrandLogo} 
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
          <Field label="Product Name"><TextInput value={form.name} onChange={set("name")} placeholder="" /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>

{CATEGORY_SIZE_TYPE[form.category] !== "none" && (
  <>

<Field
  horizontal
  label="Size Label"
>
  <div
    style={{
      display: "flex",
      justifyContent: "flex-start",
      gap: 8,
      flexWrap: "wrap",
      width: "100%",
    }}
  >
    {getSizeOptions(form.category).map((option) => {
      const active = form.size === option;

      return (
        <button
          key={option}
          type="button"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              size: option,
            }))
          }
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.color = COLOR.text;
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.color = COLOR.subtext;
            }
          }}
          style={{
            minWidth: option === "FREE" ? 56 : 38,
            padding: "9.5px 13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            lineHeight: 1,
            borderRadius: 6,
            cursor: "pointer",
            background: active ? "#ECECEC" : COLOR.bg,
            border: `1px solid ${active ? "#D9D9D9" : COLOR.border}`,
            color: active ? COLOR.text : COLOR.subtext,
            transition: "all .10s",
          }}
        >
          {option}
        </button>
      );
    })}
  </div>
</Field>
  </>
)}
</div>

          <Field label="Season" style={{ gridColumn: "1 / -1" }}>
            <SeasonPicker value={form.seasons} onChange={(v) => setField("seasons", v)} />
          </Field>
          <Field label="Retail Price"><TextInput type="number" value={form.price} onChange={set("price")} /></Field>
          <Field label="Purchase Price"><TextInput type="number" value={form.purchasePrice} onChange={set("purchasePrice")} /></Field>
          <Field label="Place of Purchase"><TextInput value={form.purchasePlace} onChange={set("purchasePlace")} /></Field>
          <Field label="Purchase Date"><TextInput type="date" value={form.purchaseDate} onChange={set("purchaseDate")} /></Field>
        </div>

        <Field label="Materials">
          <MaterialsEditor 
             materials={form.materials} 
             onChange={(m) => setField("materials", m)} 
             materialLibrary={materialLibrary}
             onAddMaterialToLibrary={onAddMaterialToLibrary}
             materialFreq={materialFreq}
          />
        </Field>

        <button onClick={handleSave} style={{
          width: "100%", marginTop: 8, padding: "12px 0", background: COLOR.text, color: "#fff",
          border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer",
        }}>Save</button>
      </div>
    </div>
  );
}
