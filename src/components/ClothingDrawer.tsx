import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Heart, Check } from "lucide-react";
import type { MaterialLibraryItem } from "../types/material";
import type { Brand } from "../types/brand";
import type { ClothingDraft, ClothingItem } from "../types/clothing";
import { BRAND_TIERS, COLOR } from "../constants/design";
import { CATEGORY_SIZE_TYPE, getSizeFields, getSizeOptions } from "../constants/sizing";
import { useAutoSave } from "../hooks/useAutoSave";
import { findBrandByName } from "../lib/brandName";
import {
  AutoResizeTextarea,
  Field,
  MediaTabs,
  SectionTitle,
  TextInput,
} from "./common";
import { SeasonPicker } from "./SeasonPicker";
import { CategoryPicker } from "./CategoryPicker";
import { BrandInput, BrandLogo, FormBrandSection } from "./BrandFields";
import { ImageManager } from "./ImageManager";
import { ReferenceManager } from "./ReferenceBoard";

/* ---------------------------------------------------------
   Clothing Detail Drawer (Auto-save)
--------------------------------------------------------- */
interface DrawerProps {
  item: ClothingItem;
  onClose: () => void;
  onSave: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
export function Drawer({ item, onClose, onSave, onDelete, brands, onAddBrand }: DrawerProps) {
  const [mediaTab, setMediaTab] = useState("photos");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBrandSection, setShowBrandSection] = useState(false);
  const brandInputRef = useRef<HTMLDivElement>(null);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  setShowDeleteConfirm(false);
}, [item.id]);

  useEffect(() => {
const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as Node;
  const clickedInput =
    brandInputRef.current?.contains(target) ?? false;
  const clickedPanel =
    brandPanelRef.current?.contains(target) ?? false;
  if (
    showBrandSection &&
    !clickedInput &&
    !clickedPanel
  ) {
    setShowBrandSection(false);
  }
};
  document.addEventListener("mousedown", handleMouseDown);
  return () => {
    document.removeEventListener("mousedown", handleMouseDown);
  };
}, [showBrandSection]);

  // 닫는 순간 새로 만든 브랜드는 아직 brands에 반영되기 전이라서, 따로 기억해 두고 함께 찾는다
  const createdBrandsRef = useRef<Brand[]>([]);

  // 저장용으로 항목을 정리하면서 브랜드 연결(brandId / brandName)을 맞춘다
  const toItem = useCallback((data: ClothingDraft): ClothingItem => {
    const typedName = (data.brandName || "").trim();
    const matched = findBrandByName([...brands, ...createdBrandsRef.current], typedName);
    const toSave: Partial<ClothingDraft> = {
      ...data,
      // 새 브랜드는 닫을 때(handleClose) 한 번만 만들기 때문에, 그 전까지는 brandId를 비워 둔다
      brandId: matched ? matched.id : "",
      brandName: matched ? matched.name : typedName,
    };
    delete toSave.brandInfo;
    delete toSave._newBrandTier;
    delete toSave._newBrandLogo;
    return toSave as ClothingItem;
  }, [brands]);

  const { draft, setDraft, status, forceSave } = useAutoSave<ClothingDraft>(
    { ...item, _newBrandTier: BRAND_TIERS[5], _newBrandLogo: "" },
    (dataToSave) => onSave(toItem(dataToSave)),
    700,
    (i) => i.id
  );

  const handleClose = useCallback(() => {
    const typedName = (draft.brandName || "").trim();
    const matched = findBrandByName([...brands, ...createdBrandsRef.current], typedName);
    if (typedName && !matched) {
      const newBrand: Brand = {
        id: crypto.randomUUID(),
        name: typedName,
        tier: draft._newBrandTier || BRAND_TIERS[5],
        logo: draft._newBrandLogo || "",
        memo: "",
        favorite: false,
        color: "#B8B8B8",
      };
      createdBrandsRef.current.push(newBrand);
      onAddBrand(newBrand);
      // 자동 저장이 이미 끝난 뒤에 닫는 경우에도 항목이 새 브랜드에 연결되도록 바로 저장한다
      onSave(toItem(draft));
    }
    forceSave();
    onClose();
  }, [draft, brands, onAddBrand, onSave, toItem, forceSave, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

useEffect(() => {
  const original = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = original;
  };
}, []);

  if (!item) return null;

function formatPurchaseDate(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value;
  const yyyy = digits.slice(0, 4);
  const mm = digits.slice(4, 6);
  const dd = digits.slice(6, 8);
  const y = Number(yyyy);
  const m = Number(mm);
  const d = Number(dd);
  const date = new Date(y, m - 1, d);
  const valid =
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;
  if (!valid) return value;
  return `${yyyy}-${mm}-${dd}`;
}


  const set = (k: keyof ClothingDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const setField = (k: keyof ClothingDraft, v: any) => setDraft((d) => ({ ...d, [k]: v }));

return (
  <>
<div
  onClick={handleClose}
  onWheel={(e) => {
    e.preventDefault();

    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop += e.deltaY;
    }
  }}
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(17,17,17,0.28)",
    zIndex: 40,
  }}
/>

    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 41,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
<div
  onClick={(e) => e.stopPropagation()}
  style={{
    width: 970,
    maxWidth: "95vw",
    height: "90vh",
    background: COLOR.bg,
    border: `1px solid ${COLOR.border}`,
    borderRadius: 12,
    boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  }}
>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "12px 28px",
            borderBottom: `1px solid ${COLOR.border}`,
          }}
        >

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {status === "saving" && (
              <span style={{ fontSize: 11, color: COLOR.subtext }}>
                Saving...
              </span>
            )}

            {status === "saved" && (
              <span style={{ fontSize: 11, color: COLOR.subtext }}>
                Saved
              </span>
            )}

            <button
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={18} color={COLOR.subtext} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Left */}
          <div
            style={{
              borderRight: `1px solid ${COLOR.border}`,
              padding: "20px 20px 24px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <MediaTabs
              active={mediaTab}
              onChange={setMediaTab}
            />

            <div
              style={{
                flex: 1,
                marginTop: 20,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {mediaTab === "photos" && (
                <ImageManager
                  images={draft.images}
                  onChange={(imgs) => setField("images", imgs)}
                />
              )}

              {mediaTab === "reference" && (
                <ReferenceManager itemId={draft.id} />
              )}
            </div>
          </div>

          {/* Right */}
<div
  ref={rightScrollRef}
  style={{
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "24px 32px 40px",
  }}
>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
 <div
    style={{
      flex: 1,
    }}
  >

  </div>
<div
  style={{
    height: 52,
    width: "100%",
    display: "grid",
    gridTemplateRows: "28px 20px",
    justifyItems: "start",
    alignContent: "start",
  }}
>
  <div
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      justifyContent: "flex-start",
    }}
  >
    <BrandLogo
      src={draft.brandInfo?.logo}
      size={19}
    />
    <div
      style={{
        fontSize: 20,
        fontWeight: 500,
        color: COLOR.text,
        lineHeight: "28px",
        textAlign: "left",
      }}
    >
      {draft.brandName || ""}
    </div>
  </div>
  <div
    style={{
      width: "100%",
      fontSize: 14,
      color: COLOR.subtext,
      lineHeight: "20px",
      textAlign: "left",
    }}
  >
    {draft.name || ""}
  </div>
</div>
              <button
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    favorite: !d.favorite,
                  }))
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Heart
                  size={20}
                  color={COLOR.text}
                  fill={draft.favorite ? COLOR.text : "none"}
                  strokeWidth={1.6}
                />
              </button>
            </div>

<SectionTitle>Basic Info</SectionTitle>

<div
  style={{
    display: "flex",
    flexDirection: "column",
  }}
>

<>
<Field
  horizontal
  label="brand"
  style={{
    marginBottom: showBrandSection ? 0 : 16,
  }}
>
    <div ref={brandInputRef}>
      <BrandInput
        value={draft.brandName}
        onChange={(v) => setField("brandName", v)}
        brands={brands.map((b) => b.name)}
        onFocus={() => setShowBrandSection(true)}
      />
    </div>
  </Field>

  {showBrandSection && (
    <div
      ref={brandPanelRef}
      style={{
        marginLeft: 104,
        marginTop: 0,
        marginBottom: 16,
      }}
    >
      <FormBrandSection
        formBrandName={draft.brandName}
        brands={brands}
        newTier={draft._newBrandTier || ""}
        setNewTier={(v) => setField("_newBrandTier", v)}
        newLogo={draft._newBrandLogo || ""}
        setNewLogo={(v) => setField("_newBrandLogo", v)}
      />
    </div>
  )}
</>

  <Field
    horizontal
    label="product"
  >
    <TextInput
      value={draft.name}
      onChange={set("name")}
      onFocus={() => setShowBrandSection(false)}
    />
  </Field>

<Field
  horizontal
  label="category"
  style={{
    alignItems: "flex-start",
  }}
>
  <CategoryPicker
    value={draft.category}
    onChange={(category) => {
      setShowBrandSection(false);
      setField("category", category);
    }}
  />
</Field>

  <Field
    horizontal
    label="season"
  >
    <SeasonPicker
      value={draft.seasons}
      onChange={(v) => setField("seasons", v)}
    />
  </Field>
</div>

<SectionTitle>Purchase Info</SectionTitle>
<div
  style={{
    display: "flex",
    flexDirection: "column",
  }}
>

  <Field
    horizontal
    label="retail price"
  >
<div
  style={{
    position: "relative",
    width: "100%",
  }}
>
  <TextInput
    type="number"
    value={draft.price}
    onChange={set("price")}
    style={{ paddingRight: 32 }}
  />
  <span
    style={{
      position: "absolute",
      right: 20,
      top: "50%",
      transform: "translateY(-50%)",
      color: COLOR.subtext,
      fontSize: 13,
      pointerEvents: "none",
      userSelect: "none",
    }}
  >
    ₩
  </span>
</div>
  </Field>
  <Field
    horizontal
    label="price paid"
  >
<div
  style={{
    position: "relative",
    width: "100%",
  }}
>
  <TextInput
    type="number"
    value={draft.purchasePrice}
    onChange={set("purchasePrice")}
    style={{ paddingRight: 32 }}
  />
  <span
    style={{
      position: "absolute",
      right: 20,
      top: "50%",
      transform: "translateY(-50%)",
      color: COLOR.subtext,
      fontSize: 13,
      pointerEvents: "none",
      userSelect: "none",
    }}
  >
    ₩
  </span>
</div>
  </Field>
  <Field
    horizontal
    label="date"
  >
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  <TextInput
    type="text"
    inputMode="numeric"
    maxLength={8}
    placeholder="YYYYMMDD"
    value={draft.purchaseDate}
    onChange={set("purchaseDate")}
    onFocus={(e) => {
      setField(
        "purchaseDate",
        e.target.value.replace(/-/g, "")
      );
    }}
    onBlur={(e) => {
      setField(
        "purchaseDate",
        formatPurchaseDate(e.target.value)
      );
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = formatPurchaseDate(
          (e.target as HTMLInputElement).value
        );
        setField("purchaseDate", value);
        (e.target as HTMLInputElement).blur();
      }
    }}
    style={{ flex: 1 }}
  />

<button
  type="button"
  onClick={() => {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    setField("purchaseDate", `${yyyy}-${mm}-${dd}`);
  }}
onMouseEnter={(e) => {
  e.currentTarget.style.color = COLOR.text;
  e.currentTarget.style.background = "#ECECEC";
  e.currentTarget.style.borderColor = "#D9D9D9";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.color = COLOR.subtext;
  e.currentTarget.style.background = COLOR.bg;
  e.currentTarget.style.borderColor = COLOR.border;
  e.currentTarget.style.transform = "translateY(0)";
}}
onMouseDown={(e) => {
  e.currentTarget.style.background = "#E2E2E2";
  e.currentTarget.style.transform = "translateY(1px)";
}}
onMouseUp={(e) => {
  e.currentTarget.style.background = "#ECECEC";
  e.currentTarget.style.transform = "translateY(0)";
}}
  style={{
    height: 36,
    minWidth: 76,
    padding: "0 20px",
    borderRadius: 6,
    border: `1px solid ${COLOR.border}`,
    background: COLOR.bg,
    color: COLOR.subtext,
    cursor: "pointer",
    fontSize: 12.5,
    whiteSpace: "nowrap",
    transition: "all .10s",
    userSelect: "none",
  }}
>
  today
</button>
</div>
  </Field>
  <Field
    horizontal
    label="place"
  >
    <TextInput
      value={draft.purchasePlace}
      onChange={set("purchasePlace")}
    />
  </Field>
</div>

{CATEGORY_SIZE_TYPE[draft.category] !== "none" && (
  <>

<SectionTitle>Size Info</SectionTitle>
<Field
  horizontal
  label="Size Label"
  style={{ marginTop: -4, marginBottom: 10 }}
>
<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    width: "100%",
    minHeight: 40,
  }}
>
{getSizeOptions(draft.category).map((option) => {
  const active = draft.size === option;

  return (
    <button
      key={option}
      type="button"
      onClick={() => setField("size", option)}
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

{getSizeFields(draft.category) && (
  <Field
    horizontal
    label="Detailed Size"
    style={{
      alignItems: "flex-start",
    }}
  >
    <div
      style={{
        width: "100%",
        border: `1px solid ${COLOR.border}`,
        borderRadius: 10,
        overflow: "hidden",
        background: COLOR.bg,
      }}
    >
      {getSizeFields(draft.category)!.map((row, index) => (
        <div
          key={row.key}
          style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 89px",
            alignItems: "center",
            minHeight: 44,
            borderTop:
              index === 0
                ? "none"
                : "1px solid #F6F6F6",
          }}
        >
          <div
            style={{
              paddingLeft: 20,
              fontSize: 12.5,
              fontWeight: 400,
              color: COLOR.subtext,
              justifySelf: "start",
              width: "100%",
              textAlign: "left",
            }}
          >
            {row.label}
          </div>
          <input
            type="number"
            value={draft[row.key] as string | number}
            onChange={(e) => setField(row.key, e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              fontWeight: 300,
              color: COLOR.text,
              padding: 0,
              margin: 0,
              textAlign: "right",
              paddingRight: 18,
            }}
          />
          <div
            style={{
              fontSize: 12.5,
              color: COLOR.subtext,
              textAlign: "center",
            }}
          >
            cm
          </div>
        </div>
      ))}
    </div>
  </Field>
)}

</>
)}

<div style={{ height: 1 }} />

<SectionTitle>Additional Info</SectionTitle>
<Field
  horizontal
  label="Materials"
  style={{
    alignItems: "flex-start",
    marginBottom: 11,
  }}
>
  <AutoResizeTextarea
    value={draft.materialNote ?? ""}
    onChange={(e) => setField("materialNote", e.target.value)}
    minRows={3}
  />
</Field>

<Field
  horizontal
  label="Memo"
  style={{
    alignItems: "flex-start",
  }}
>
  <AutoResizeTextarea
    value={draft.memo}
    onChange={set("memo")}
    minRows={3}
  />
</Field>

<Field
  horizontal
  label="Repair Needed"
  style={{
    alignItems: "center",
    marginTop: -4,
    marginBottom: 20,
  }}
>
<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    paddingTop: 2,
  }}
>
<button
  type="button"
  onClick={() => setField("repairNeeded", !draft.repairNeeded)}
  style={{
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    border: `1px solid ${
      draft.repairNeeded ? "#D9D9D9" : COLOR.border
    }`,
    background: draft.repairNeeded
      ? "#ECECEC"
      : COLOR.bg,
    cursor: "pointer",
    transition: "all .12s",
    padding: 0,
  }}
>
  {draft.repairNeeded && (
    <Check
      size={12}
      strokeWidth={2.5}
      color={COLOR.text}
    />
  )}
</button>
  </div>
</Field>

<button
  onClick={() => setShowDeleteConfirm(true)}
  style={{
    width: "100%",
    padding: "11px 0",
    background: "#F5F5F5",
    color: COLOR.subtext,
    border: "1px solid #E3E3E3",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
  }}
>
  Delete
</button>

          </div> {/* Right */}
        </div> {/* Body */}
      </div> {/* Modal */}
    </div> {/* Overlay */}

{showDeleteConfirm && (
  <div
    onClick={() => setShowDeleteConfirm(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 340,
        background: COLOR.bg,
        borderRadius: 10,
        border: `1px solid ${COLOR.border}`,
        padding: "22px",
        boxShadow: "0 18px 48px rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          textAlign: "center",
          color: COLOR.text,
          marginBottom: 22,
        }}
      >
        Move this item to Recycle Bin?
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            flex: 1,
            height: 36,
            background: COLOR.bg,
            border: `1px solid ${COLOR.border}`,
            borderRadius: 6,
            color: COLOR.text,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onDelete(draft.id)}
          style={{
            flex: 1,
            height: 36,
            background: "#ECECEC",
            border: "1px solid #D9D9D9",
            borderRadius: 6,
            color: COLOR.text,
            fontSize: 13,
            cursor: "pointer",
            transition: "all .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E3E3E3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ECECEC";
          }}
        >
          Move
        </button>
      </div>
    </div>
  </div>
)}

  </>
);
}
