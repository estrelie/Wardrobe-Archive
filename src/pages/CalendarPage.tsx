import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Category, CategoryGroup } from "../types/common";
import type { ClothingItem } from "../types/clothing";
import { CATEGORY_GROUPS, COLOR } from "../constants/design";
import { fmtWon } from "../lib/format";
import { parseYmd, purchaseStats } from "../lib/purchaseLog";
import type { PurchaseEntry, PurchaseStatus } from "../lib/purchaseLog";
import { SectionTitle, StatBox } from "../components/common";

// --- src/pages/CalendarPage.tsx ---
interface CalendarPageProps {
  /** 옷장 + 휴지통 + 영구 삭제된 옷의 구매 기록 */
  entries: PurchaseEntry[];
  onOpenItem: (item: ClothingItem) => void;
  /** 영구 삭제되어 구매 기록만 남은 항목의 기록을 지운다 */
  onRemoveRecord: (id: string) => void;
}

/** 옷장에 없는 구매 기록에 붙이는 작은 표시 */
function StatusTag({ status }: { status: PurchaseStatus }) {
  if (status === "owned") return null;
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 400, color: COLOR.subtext, background: COLOR.bg2,
      border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {status === "bin" ? "In bin" : "Removed"}
    </span>
  );
}

export function CalendarPage({ entries, onOpenItem, onRemoveRecord }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterCategory, setFilterCategory] =  useState<CategoryGroup | "All">("All");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmRemoveId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmRemoveId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmRemoveId]);

  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterDate = useCallback((dateStr: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredDateStr(dateStr);
  }, []);

  const handleMouseLeaveDate = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDateStr(null);
    }, 150);
  }, []);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // 지금 가진 옷만 볼지, 휴지통·삭제된 옷의 구매 기록까지 볼지
  const visibleEntries = useMemo(
    () => (ownedOnly ? entries.filter((e) => e.status === "owned") : entries),
    [entries, ownedOnly]
  );

  const monthEntries = useMemo(() => {
    return visibleEntries.filter((e) => {
      const p = parseYmd(e.purchaseDate);
      return p !== null && p.y === currentDate.getFullYear() && p.m === currentDate.getMonth() + 1;
    });
  }, [visibleEntries, currentDate]);

  const filteredMonthItems = useMemo(() => {
    if (filterCategory === "All") return monthEntries;
    return monthEntries.filter((e) =>
      CATEGORY_GROUPS[filterCategory].includes(e.category as Category)
    );
  }, [monthEntries, filterCategory]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, PurchaseEntry[]> = {};
    filteredMonthItems.forEach(item => {
      if (!groups[item.purchaseDate]) groups[item.purchaseDate] = [];
      groups[item.purchaseDate].push(item);
    });
    return groups;
  }, [filteredMonthItems]);

  const stats = useMemo(
    () => purchaseStats(visibleEntries, monthEntries, new Date()),
    [visibleEntries, monthEntries]
  );

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const filterOptions: ("All" | CategoryGroup)[] = [
  "All",
  "Tops",
  "Dress",
  "Bottoms",
  "Outerwear",
  "Others",];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>Calendar</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} color={COLOR.subtext} /></button>
          <div style={{ fontSize: 16, fontWeight: 500, color: COLOR.text, minWidth: 120, textAlign: "center" }}>{monthName}</div>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronRight size={20} color={COLOR.subtext} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Monthly Items" value={`${stats.count} ${stats.count === 1 ? "item" : "items"}`} />
        <StatBox label="Monthly Spending" value={fmtWon(stats.spend)} />
        <StatBox label="Avg. Purchase Gap" value={`${stats.avgGap} ${stats.avgGap === 1 ? "day" : "days"}`} />
        <StatBox label="Days Since Last Purchase" value={`${stats.daysSinceLast} ${stats.daysSinceLast === 1 ? "day" : "days"}`} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {filterOptions.map(cat => {
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: "6px 14px", fontSize: 12.5, borderRadius: 20, cursor: "pointer",
                border: `1px solid ${active ? COLOR.text : COLOR.border}`,
                background: active ? COLOR.text : COLOR.bg,
                color: active ? "#fff" : COLOR.text,
                transition: "all 0.15s ease"
              }}
            >
              {cat}
            </button>
          );
        })}
        <button
          onClick={() => setOwnedOnly((v) => !v)}
          title="Show only items currently in your wardrobe"
          style={{
            marginLeft: "auto", padding: "6px 14px", fontSize: 12.5, borderRadius: 20, cursor: "pointer",
            border: `1px solid ${ownedOnly ? COLOR.text : COLOR.border}`,
            background: ownedOnly ? COLOR.text : COLOR.bg,
            color: ownedOnly ? "#fff" : COLOR.text,
            transition: "all 0.15s ease",
          }}
        >
          Owned only
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${COLOR.border}`, borderLeft: `1px solid ${COLOR.border}`, borderRadius: "8px 8px 0 0", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {dayLabels.map((day, i) => (
            <div key={day} style={{ 
              padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 500, color: COLOR.subtext, 
              borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`,
              borderTopLeftRadius: i === 0 ? 8 : 0,
              borderTopRightRadius: i === dayLabels.length - 1 ? 8 : 0,
              background: COLOR.bg2 
            }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`, minHeight: 110, background: COLOR.bg2, opacity: 0.3 }} />;
            
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateStr = `${y}-${m}-${dStr}`;
            const dayItems = groupedByDate[dateStr] || [];

            const colIndex = (firstDayOfWeek + day - 1) % 7;
            const rowIndex = Math.floor((firstDayOfWeek + day - 1) / 7);
            const totalRows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
            const isFirstCol = colIndex === 0;
            const isLastCol = colIndex === 6;
            const isBottomRow = rowIndex >= totalRows - 2;

            return (
              <div 
                key={dateStr} 
                onClick={() => dayItems.length > 0 && setSelectedDateStr(dateStr)}
                style={{ 
                  position: "relative",
                  borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}`, 
                  minHeight: 110, padding: 8, display: "flex", flexDirection: "column",
                  cursor: dayItems.length > 0 ? "pointer" : "default",
                  transition: "background 0.2s",
                  background: COLOR.bg
                }}
                onMouseEnter={(e) => { 
                  if (dayItems.length > 0) {
                    e.currentTarget.style.background = COLOR.bg2;
                    handleMouseEnterDate(dateStr);
                  }
                }}
                onMouseLeave={(e) => { 
                  if (dayItems.length > 0) {
                    e.currentTarget.style.background = COLOR.bg;
                    handleMouseLeaveDate();
                  }
                }}
              >
                <div style={{ fontSize: 13, color: dayItems.length > 0 ? COLOR.text : COLOR.subtext, fontWeight: dayItems.length > 0 ? 500 : 400, marginBottom: 8 }}>{day}</div>
                <div style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap", alignContent: "flex-start" }}>
                  {dayItems.slice(0, 2).map((item) => (
                    <div key={item.id} style={{ width: 32, height: 40, borderRadius: 4, overflow: "hidden", background: COLOR.bg2, border: `1px solid ${COLOR.border}` }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "owned" ? 1 : 0.55 }} />}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div style={{ width: 32, height: 40, borderRadius: 4, background: COLOR.bg2, border: `1px dashed ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: COLOR.subtext }}>
                      +{dayItems.length - 2}
                    </div>
                  )}
                </div>

                {hoveredDateStr === dateStr && dayItems.length > 0 && (
                  <div 
                    onMouseEnter={() => handleMouseEnterDate(dateStr)}
                    onMouseLeave={handleMouseLeaveDate}
                    style={{
                      position: "absolute",
                      top: isBottomRow ? "auto" : "calc(100% + 4px)",
                      bottom: isBottomRow ? "calc(100% + 4px)" : "auto",
                      left: isFirstCol ? 0 : isLastCol ? "auto" : "50%",
                      right: isLastCol ? 0 : "auto",
                      transform: isFirstCol || isLastCol ? "none" : "translateX(-50%)",
                      width: 240,
                      maxHeight: 320,
                      overflowY: "auto",
                      background: COLOR.bg,
                      border: `1px solid ${COLOR.border}`,
                      borderRadius: 8,
                      boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                      padding: 8,
                      zIndex: 50,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      cursor: "default"
                    }}
                  >
                    {dayItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={(e) => { e.stopPropagation(); if (item.item) { onOpenItem(item.item); setHoveredDateStr(null); } }}
                        style={{ display: "flex", gap: 12, padding: 8, borderRadius: 6, transition: "background 0.2s", cursor: item.item ? "pointer" : "default" }}
                        onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 44, height: 56, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0, border: `1px solid ${COLOR.border}` }}>
                          {item.image && <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "owned" ? 1 : 0.55 }} alt="" />}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 2 }}>{item.brandName}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: COLOR.text, display: "flex", alignItems: "center", gap: 6 }}>{fmtWon(item.purchasePrice)}<StatusTag status={item.status} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SectionTitle>Timeline</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingLeft: 16 }}>
        {sortedDates.length === 0 && <div style={{ fontSize: 13.5, color: COLOR.subtext, padding: "20px 0" }}>No purchase records for this month.</div>}
        {sortedDates.map(dateStr => (
          <div key={dateStr} style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: -24, top: 4, width: 8, height: 8, borderRadius: "50%", background: COLOR.text }} />
            <div style={{ position: "absolute", left: -21, top: 20, bottom: -24, width: 2, background: COLOR.border }} />
            
            <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.text, marginBottom: 12 }}>
              {new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groupedByDate[dateStr].map(item => (
                <div key={item.id} onClick={() => item.item && onOpenItem(item.item)} style={{ display: "flex", gap: 16, padding: 16, border: `1px solid ${COLOR.border}`, borderRadius: 8, background: COLOR.bg, cursor: item.item ? "pointer" : "default", transition: "border-color 0.2s" }}
                     onMouseEnter={e => e.currentTarget.style.borderColor = "#C9C9C9"}
                     onMouseLeave={e => e.currentTarget.style.borderColor = COLOR.border}>
                  <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                    {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "owned" ? 1 : 0.55 }} />}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{item.brandName}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>{item.name}<StatusTag status={item.status} /></div>
                    <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                    {item.status === "removed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRemoveId(item.id); }}
                        style={{ alignSelf: "flex-start", marginTop: 8, padding: 0, background: "none", border: "none", fontSize: 11.5, color: COLOR.subtext, textDecoration: "underline", cursor: "pointer" }}
                      >
                        Remove record
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedDateStr && (
        <>
          <div onClick={() => setSelectedDateStr(null)} style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.28)", zIndex: 37 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw", background: COLOR.bg, borderLeft: `1px solid ${COLOR.border}`, zIndex: 38, overflowY: "auto", padding: "22px 24px 40px", boxShadow: "-12px 0 32px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: COLOR.text }}>
                {new Date(selectedDateStr).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <button onClick={() => setSelectedDateStr(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <X size={18} color={COLOR.subtext} />
              </button>
            </div>
            
            <SectionTitle>Purchased Items</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(groupedByDate[selectedDateStr] || []).map(item => (
                <div key={item.id} onClick={() => item.item && onOpenItem(item.item)} style={{ display: "flex", gap: 14, padding: 12, border: `1px solid ${COLOR.border}`, borderRadius: 8, cursor: item.item ? "pointer" : "default", background: COLOR.bg }}
                     onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                     onMouseLeave={e => e.currentTarget.style.background = COLOR.bg}>
                   <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                     {item.image && <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.status === "owned" ? 1 : 0.55 }} alt="" />}
                   </div>
                   <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                     <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 4 }}>{item.brandName}</div>
                     <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>{item.name}<StatusTag status={item.status} /></div>
                     <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                    {item.status === "removed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRemoveId(item.id); }}
                        style={{ alignSelf: "flex-start", marginTop: 8, padding: 0, background: "none", border: "none", fontSize: 11.5, color: COLOR.subtext, textDecoration: "underline", cursor: "pointer" }}
                      >
                        Remove record
                      </button>
                    )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {confirmRemoveId && (
        <div
          onClick={() => setConfirmRemoveId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 340, background: COLOR.bg, borderRadius: 10, border: `1px solid ${COLOR.border}`, padding: "22px", boxShadow: "0 18px 48px rgba(0,0,0,.12)" }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: "center", color: COLOR.text, marginBottom: 10 }}>
              Remove this purchase record?
            </div>
            <div style={{ fontSize: 12, textAlign: "center", color: COLOR.subtext, lineHeight: 1.6, marginBottom: 22 }}>
              It will no longer appear in the Calendar. This can't be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmRemoveId(null)}
                style={{ flex: 1, height: 36, background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onRemoveRecord(confirmRemoveId); setConfirmRemoveId(null); }}
                style={{ flex: 1, height: 36, background: "#ECECEC", border: "1px solid #D9D9D9", borderRadius: 6, color: COLOR.text, fontSize: 13, cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
