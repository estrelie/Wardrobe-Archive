import React, { useState, useMemo, useRef } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import type { BrandTier } from "../types/common";
import type { Brand } from "../types/brand";
import { BRAND_TIERS, COLOR } from "../constants/design";
import { fileToCompressedDataUrl } from "../lib/image";
import { Select, TextInput } from "./common";

interface BrandInputProps {
  value: string;
  onChange: (val: string) => void;
  brands: string[];
  onFocus?: () => void;
  onBlur?: () => void;
}
export function BrandInput({
  value,
  onChange,
  brands,
  onFocus,
  onBlur,
}: BrandInputProps) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = Array.from(new Set(brands.filter(Boolean)));
    const list = q ? pool.filter((b) => b.toLowerCase().includes(q) && b.toLowerCase() !== q) : pool;
    return list.slice(0, 6);
  }, [value, brands]);

  return (
    <div style={{ position: "relative" }}>
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() =>
          setTimeout(() => {
            setFocused(false);
            onBlur?.();
          }, 120)
        }
        placeholder=""
      />
      {focused && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: COLOR.bg, border: "1px solid #ECECEC", borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,.05)", maxHeight: 180, overflowY: "auto",
        }}>
          {suggestions.map((b) => (
            <div key={b} onMouseDown={() => onChange(b)} style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLOR.bg2}
              onMouseLeave={(e) => e.currentTarget.style.background = COLOR.bg}>
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BrandLogoProps {
  src?: string;
  size?: number;
}
export function BrandLogo({ src, size = 16 }: BrandLogoProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size, height: size, objectFit: "contain", borderRadius: 3,
        border: `1px solid ${COLOR.border}`, background: "#fff", flexShrink: 0,
      }}
    />
  );
}

interface BrandLogoPickerProps {
  value: string;
  onChange: (val: string) => void;
}
export function BrandLogoPicker({ value, onChange }: BrandLogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 240, 0.9);
      onChange(dataUrl);
    } catch (err) {
      console.error("logo processing failed", err);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div
  style={{
    position: "relative",
    flexShrink: 0,
  }}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
      <div
        onClick={() => inputRef.current?.click()}
style={{
  width: "100%",
  height: "100%",
  borderRadius: 6,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  background: "transparent",
}}
      >
        {busy
          ? <span style={{ fontSize: 8.5, color: COLOR.subtext }}>...</span>
          : value
            ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", }} />
            : <ImageIcon size={14} color={COLOR.subtext} />}
      </div>
      {value && !busy && hovered && (
        <button type="button" onClick={() => onChange("")} style={{
          position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
          background: "rgba(255,255,255,0.92)", border: `1px solid ${COLOR.border}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>
          <X size={11} strokeWidth={2} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

interface FormBrandSectionProps {
  formBrandName: string;
  brands: Brand[];
  newTier: BrandTier | string;
  setNewTier: (val: BrandTier | string) => void;
  newLogo: string;
  setNewLogo: (val: string) => void;
}

export function FormBrandSection({
  formBrandName,
  brands,
  newTier,
  setNewTier,
  newLogo,
  setNewLogo,
}: FormBrandSectionProps) {

  const wrapperRef = useRef<HTMLDivElement>(null);
  const matchedBrand = brands.find(
    (b) => b.name === formBrandName
  );
  if (!formBrandName) {
    return null;
  }
  if (matchedBrand) {
    return null;
  }

return (
  <div
    ref={wrapperRef}
    style={{
      marginTop: 8,
      padding: 10,
      background: COLOR.bg,
      border: `1px solid ${COLOR.border}`,
      borderRadius: 10,
      transition: "box-shadow .18s ease, border-color .18s ease",
      boxShadow: "0 4px 16px rgba(0,0,0,.05)",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${COLOR.border}`,
          borderRadius: 6,
          background: COLOR.bg,
          overflow: "hidden",
        }}
      >
        <BrandLogoPicker
          value={newLogo}
          onChange={setNewLogo}
        />
      </div>

      <Select
        value={newTier}
        onChange={(e) => setNewTier(e.target.value)}
        style={{
          height: 40,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: 6,
        }}
      >
        {BRAND_TIERS.map((tier) => (
          <option key={tier}>{tier}</option>
        ))}
      </Select>
    </div>
  </div>
);
}
