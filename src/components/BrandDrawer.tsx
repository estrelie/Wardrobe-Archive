import { useMemo, useEffect, useCallback, useState } from "react";
import { X, Heart, Shirt } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Category } from "../types/common";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import { BRAND_TIERS, CATEGORY_GROUPS, COLOR } from "../constants/design";
import { fmtWon } from "../lib/format";
import { normalizeBrandName } from "../lib/brandName";
import { useAutoSave } from "../hooks/useAutoSave";
import { SectionTitle, Select, inputStyle } from "./common";
import { BrandLogoPicker } from "./BrandFields";
import { ClothingCard } from "./ClothingCard";

/* ---------------------------------------------------------
   Brand Detail Drawer (Auto-save)
--------------------------------------------------------- */
interface BrandDrawerProps {
  brand: Brand;
  onClose: () => void;
  onViewInWardrobe: (brandId: string) => void;
  onUpdateBrand: (updated: Brand) => void;
  onDeleteBrand: (id: string) => void;
  /** 휴지통에 있는, 이 브랜드의 항목 수 (삭제 확인창 안내용) */
  trashedItemCount: number;
  /** 이 브랜드를 뺀 나머지 브랜드 이름 (이름 중복 경고용) */
  otherBrandNames: string[];
  items: ClothingItem[];
}
export function BrandDrawer({ brand, onClose, onViewInWardrobe, onUpdateBrand, onDeleteBrand, trashedItemCount, otherBrandNames, items }: BrandDrawerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { draft, setDraft, status, forceSave } = useAutoSave<Brand>(
    brand,
    (dataToSave) => {
      onUpdateBrand(dataToSave);
    },
    700,
    (b) => b.id
  );

  const handleClose = useCallback(() => {
    forceSave();
    onClose();
  }, [forceSave, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showDeleteConfirm) setShowDeleteConfirm(false);
      else handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, showDeleteConfirm]);

  // 옷장(휴지통 제외)에 이 브랜드의 옷이 있으면 삭제할 수 없다
  const activeItemCount = items.filter((i) => i.brandId === brand.id).length;
  const draftNameKey = normalizeBrandName(draft.name);
  const nameConflict = draftNameKey !== "" && otherBrandNames.some((n) => normalizeBrandName(n) === draftNameKey);

  const stats = useMemo(() => {
    if (!draft) return null;
    const totalWardrobeCount = items.length;
    const bItems = items.filter(i => i.brandId === draft.id);
    const count = bItems.length;
    const percentage = totalWardrobeCount > 0 ? ((count / totalWardrobeCount) * 100).toFixed(1) : "0.0";

    let totalSpend = 0;
    let favCount = 0;
    const categoryCounts: Record<string, number> = {};
    const seasonCounts: Record<string, number> = { "봄/가을": 0, "여름": 0, "겨울": 0 };
    const dates: Date[] = [];

    bItems.forEach((i) => {
      totalSpend += Number(i.purchasePrice || 0);
      if (i.favorite) favCount++;
      if (i.category) {
        const group = Object.entries(CATEGORY_GROUPS).find(([, categories]) =>
          categories.includes(i.category as Category)
        )?.[0] ?? "Others";
        categoryCounts[group] = (categoryCounts[group] || 0) + 1;
      }
      (i.seasons || []).forEach((s) => {
        if (seasonCounts[s] !== undefined) seasonCounts[s]++;
      });
      if (i.purchaseDate) {
         const d = new Date(i.purchaseDate);
         if (!isNaN(d.getTime())) dates.push(d);
      }
    });

    const pricedItems = bItems.filter((i) => Number(i.purchasePrice || 0) > 0);
    const avgPrice = pricedItems.length ? Math.round(totalSpend / pricedItems.length) : 0;
    
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    const categoryList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    const seasonChart = [
      { name: "봄/가을", value: seasonCounts["봄/가을"] },
      { name: "여름", value: seasonCounts["여름"] },
      { name: "겨울", value: seasonCounts["겨울"] }
    ];

    let avgDays = 0;
    let oldestDate = "-";
    let newestDate = "-";

    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      oldestDate = dates[0].toISOString().split('T')[0];
      newestDate = dates[dates.length - 1].toISOString().split('T')[0];

      const today = new Date();
      const totalMs = dates.reduce((sum, d) => sum + (today.getTime() - d.getTime()), 0);
      avgDays = Math.round((totalMs / dates.length) / (1000 * 60 * 60 * 24));
    }

    const recentItems = [...bItems].sort((a, b) => {
      const da = new Date(a.purchaseDate).getTime() || 0;
      const db = new Date(b.purchaseDate).getTime() || 0;
      return db - da; 
    });

    return { 
      count, percentage, totalSpend, avgPrice, favCount, 
      topCategory, categoryList, seasonChart,
      avgDays, oldestDate, newestDate, recentItems
    };
  }, [draft, items]);

  if (!draft || !stats) return null;

  const BStat = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 6, padding: "12px 14px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: COLOR.bg }}>
      <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 8, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: COLOR.text, letterSpacing: -0.3 }}>{value}</span>
        {sub && <span style={{ fontSize: 11.5, color: COLOR.subtext }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.28)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw",
        background: COLOR.bg, borderLeft: `1px solid ${COLOR.border}`, zIndex: 41,
        overflowY: "auto", padding: "22px 24px 40px", boxShadow: "-12px 0 32px rgba(0,0,0,0.06)",
      }}>

        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  }}
>
  {/* Left */}
<div style={{ flex: 1 }}>

  {/* Logo + Name */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 22,
    }}
  >
    <BrandLogoPicker
      value={draft.logo}
      onChange={(v) => setDraft(d => ({ ...d, logo: v }))}
    />

    <input
      value={draft.name}
      onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
      style={{
        fontSize: 20,
        fontWeight: 500,
        color: COLOR.text,
        border: "none",
        background: "transparent",
        outline: "none",
        padding: 0,
        width: 220,
        borderBottom: "1px solid transparent",
      }}
      onFocus={e => e.target.style.borderBottomColor = COLOR.text}
      onBlur={e => e.target.style.borderBottomColor = "transparent"}
    />
  </div>
  {nameConflict && (
    <div style={{ fontSize: 11.5, color: "#B3261E", marginTop: -14, marginBottom: 16 }}>
      A brand with this name already exists, so this name won't be saved.
    </div>
  )}

  <div
  style={{
    display: "flex",
    alignItems: "flex-end",
    gap: 28,
    marginBottom: 22,
  }}
>
  <div>
    <div
      style={{
        fontSize: 11,
        color: COLOR.subtext,
        marginBottom: 6,
      }}
    >
      Category
    </div>

    <Select
      value={draft.tier}
      onChange={e => setDraft(d => ({ ...d, tier: e.target.value }))}
      style={{
        width: 170,
        padding: "6px 10px",
        fontSize: 12,
      }}
    >
      {BRAND_TIERS.map(t => (
        <option key={t}>{t}</option>
      ))}
    </Select>
  </div>

  <div>
  <div
    style={{
      fontSize: 11,
      color: COLOR.subtext,
      marginBottom: 4.5,
    }}
  >
    Color
  </div>

  <div
  style={{
      width: 45,
      height: 32,
      border: `1px solid ${COLOR.border}`,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLOR.bg,
      boxSizing: "border-box",
      marginTop: 2,
  }}
>
    <input
      type="color"
      value={draft.color || "#B8B8B8"}
      onChange={e =>
        setDraft(d => ({
          ...d,
          color: e.target.value,
        }))
      }
      style={{
        width: 20,
        height: 16,
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "transparent",
      }}
    />
  </div>
</div>
</div>

</div>

  {/* Right */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    {status === "saving" && (
      <span
        style={{
          fontSize: 11,
          color: COLOR.subtext,
        }}
      >
        Saving...
      </span>
    )}

    {status === "saved" && (
      <span
        style={{
          fontSize: 11,
          color: COLOR.subtext,
        }}
      >
        Saved
      </span>
    )}

    <button
      onClick={() =>
        setDraft(d => ({
          ...d,
          favorite: !d.favorite,
        }))
      }
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
      }}
    >
      <Heart
        size={18}
        color={COLOR.text}
        fill={draft.favorite ? COLOR.text : "none"}
        strokeWidth={1.6}
      />
    </button>

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

        <div style={{ borderTop: `1px solid ${COLOR.border}`, opacity: 0.6, marginBottom: 20 }} />

        <SectionTitle>Memo</SectionTitle>
        <textarea
          value={draft.memo || ""}
          onChange={(e) => setDraft(d => ({ ...d, memo: e.target.value }))}
          rows={3}
          placeholder="Add a memo for this brand..."
          style={{ ...inputStyle, resize: "vertical", marginBottom: 18, fontFamily: "inherit" }}
        />

        <SectionTitle>Statistics</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <BStat label="Items Owned" value={`${stats.count}`} sub={`${stats.percentage}% of total`} />
          <BStat label="Favorites" value={`${stats.favCount}`} sub={`out of ${stats.count}`} />
          <BStat label="Total Spending" value={fmtWon(stats.totalSpend)} />
          <BStat label="Average Purchase Price" value={fmtWon(stats.avgPrice)} />
          <BStat label="Avg. Ownership" value={`${stats.avgDays} days`} />
          <BStat label="Latest Purchase" value={stats.newestDate} />
          <BStat label="First Purchase" value={stats.oldestDate} />
          <BStat label="Top Category" value={stats.topCategory} />
        </div>

        <SectionTitle>Season Distribution</SectionTitle>
        <div style={{ height: 140, marginBottom: 24, marginLeft: -25 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.seasonChart} margin={{ left: 0, bottom: 0, top: 10 }}>
              <CartesianGrid vertical={false} stroke={COLOR.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLOR.subtext }} axisLine={{ stroke: COLOR.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: COLOR.subtext }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: COLOR.bg2 }} contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${COLOR.border}`, boxShadow: 'none' }} />
              <Bar dataKey="value" fill={draft.color || COLOR.text} radius={[2, 2, 0, 0]} maxBarSize={32} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Category Distribution</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {stats.categoryList.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
              <div style={{ width: 60, color: COLOR.subtext }}>{c.name}</div>
              <div style={{ flex: 1, height: 6, background: COLOR.bg2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(c.value / stats.count) * 100}%`, height: '100%', background: draft.color || COLOR.text, opacity: 0.8 }} />
              </div>
              <div style={{ width: 20, textAlign: 'right', fontWeight: 500, color: COLOR.text }}>{c.value}</div>
            </div>
          ))}
          {stats.categoryList.length === 0 && <div style={{ fontSize: 12, color: COLOR.subtext }}>No data</div>}
        </div>

        <SectionTitle>Collection</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 12px", marginBottom: 8 }}>
          {stats.recentItems.slice(0, 8).map((item) => (
            <ClothingCard key={item.id} item={item} onOpen={() => {}} onToggleFavorite={() => {}} accentColor={draft.color} />
          ))}
          {stats.recentItems.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: COLOR.subtext, fontSize: 12, background: COLOR.bg2, borderRadius: 6 }}>
              No items
            </div>
          )}
        </div>

        <button
          onClick={() => onViewInWardrobe(draft.id)}
          style={{
            width: "100%", marginTop: 10, padding: "12px 0", background: COLOR.text, color: "#fff",
            border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          <Shirt size={16} /> View in Wardrobe
        </button>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${COLOR.border}` }}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={activeItemCount > 0}
            style={{
              width: "100%", padding: "11px 0", background: "#F5F5F5", color: COLOR.subtext,
              border: "1px solid #E3E3E3", borderRadius: 6, fontSize: 14,
              cursor: activeItemCount > 0 ? "not-allowed" : "pointer",
              opacity: activeItemCount > 0 ? 0.55 : 1,
            }}
          >
            Delete brand
          </button>
          {activeItemCount > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: COLOR.subtext, textAlign: "center", lineHeight: 1.5 }}>
              {activeItemCount} item{activeItemCount > 1 ? "s" : ""} still {activeItemCount > 1 ? "use" : "uses"} this brand. Move or delete {activeItemCount > 1 ? "them" : "it"} first.
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.18)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 340, background: COLOR.bg, borderRadius: 10, border: `1px solid ${COLOR.border}`,
              padding: "22px", boxShadow: "0 18px 48px rgba(0,0,0,.12)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: "center", color: COLOR.text, marginBottom: 10 }}>
              Delete this brand?
            </div>
            <div style={{ fontSize: 12, textAlign: "center", color: COLOR.subtext, lineHeight: 1.6, marginBottom: 22 }}>
              Its tier, logo and memo will be removed. This can't be undone.
              {trashedItemCount > 0 && (
                <div style={{ marginTop: 8 }}>
                  {trashedItemCount} item{trashedItemCount > 1 ? "s" : ""} in the Recycle Bin {trashedItemCount > 1 ? "use" : "uses"} this brand.
                  If you restore {trashedItemCount > 1 ? "them" : "it"}, the brand will be recreated with default settings.
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, height: 36, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => onDeleteBrand(brand.id)}
                style={{ flex: 1, height: 36, background: "#ECECEC", border: "1px solid #D9D9D9", borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer", transition: "all .12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E3E3E3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ECECEC"; }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
