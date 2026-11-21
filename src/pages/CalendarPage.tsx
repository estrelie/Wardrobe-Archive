import { useState, useMemo, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Category, CategoryGroup } from "../types/common";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import { CATEGORY_GROUPS, COLOR } from "../constants/design";
import { fmtWon } from "../lib/format";
import { SectionTitle, StatBox } from "../components/common";

// --- src/pages/CalendarPage.tsx ---
interface CalendarPageProps {
  items: ClothingItem[];
  brands: Brand[];
  onOpenItem: (item: ClothingItem) => void;
}

export function CalendarPage({ items, onOpenItem }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterCategory, setFilterCategory] =  useState<CategoryGroup | "All">("All");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

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

  const validItems = useMemo(() => items.filter(i => i.purchaseDate), [items]);

  const monthItems = useMemo(() => {
    return validItems.filter(i => {
      const d = new Date(i.purchaseDate);
      return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
    });
  }, [validItems, currentDate]);

  const filteredMonthItems = useMemo(() => {
    if (filterCategory === "All") return monthItems;
    return monthItems.filter((item) =>
      CATEGORY_GROUPS[filterCategory].includes(item.category as Category)
    );
  }, [monthItems, filterCategory]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ClothingItem[]> = {};
    filteredMonthItems.forEach(item => {
      if (!groups[item.purchaseDate]) groups[item.purchaseDate] = [];
      groups[item.purchaseDate].push(item);
    });
    return groups;
  }, [filteredMonthItems]);

  const stats = useMemo(() => {
    const count = monthItems.length;
    const spend = monthItems.reduce((sum, i) => sum + Number(i.purchasePrice || 0), 0);

    const allSorted = [...validItems].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
    let avgGap = 0;
    let daysSinceLast = 0;

    if (allSorted.length > 1) {
      let totalGap = 0;
      for(let i=1; i<allSorted.length; i++) {
        totalGap += new Date(allSorted[i].purchaseDate).getTime() - new Date(allSorted[i-1].purchaseDate).getTime();
      }
      avgGap = Math.round(totalGap / (allSorted.length - 1) / (1000 * 3600 * 24));
    }

    if (allSorted.length > 0) {
      const lastDate = new Date(allSorted[allSorted.length - 1].purchaseDate);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      daysSinceLast = Math.max(0, Math.floor((todayStart.getTime() - lastStart.getTime()) / (1000 * 3600 * 24)));
    }

    return { count, spend, avgGap, daysSinceLast };
  }, [monthItems, validItems]);

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
                  {dayItems.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ width: 32, height: 40, borderRadius: 4, overflow: "hidden", background: COLOR.bg2, border: `1px solid ${COLOR.border}` }}>
                      {item.images[0] && <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
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
                        onClick={(e) => { e.stopPropagation(); onOpenItem(item); setHoveredDateStr(null); }}
                        style={{ display: "flex", gap: 12, padding: 8, borderRadius: 6, transition: "background 0.2s", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 44, height: 56, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0, border: `1px solid ${COLOR.border}` }}>
                          {item.images[0] && <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 2 }}>{item.brandName}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: COLOR.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
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
                <div key={item.id} onClick={() => onOpenItem(item)} style={{ display: "flex", gap: 16, padding: 16, border: `1px solid ${COLOR.border}`, borderRadius: 8, background: COLOR.bg, cursor: "pointer", transition: "border-color 0.2s" }}
                     onMouseEnter={e => e.currentTarget.style.borderColor = "#C9C9C9"}
                     onMouseLeave={e => e.currentTarget.style.borderColor = COLOR.border}>
                  <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                    {item.images[0] && <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 11.5, color: COLOR.subtext, marginBottom: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{item.brandName}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
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
                <div key={item.id} onClick={() => onOpenItem(item)} style={{ display: "flex", gap: 14, padding: 12, border: `1px solid ${COLOR.border}`, borderRadius: 8, cursor: "pointer", background: COLOR.bg }}
                     onMouseEnter={e => e.currentTarget.style.background = COLOR.bg2}
                     onMouseLeave={e => e.currentTarget.style.background = COLOR.bg}>
                   <div style={{ width: 64, height: 80, borderRadius: 4, background: COLOR.bg2, overflow: "hidden", flexShrink: 0 }}>
                     {item.images[0] && <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
                   </div>
                   <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                     <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 4 }}>{item.brandName}</div>
                     <div style={{ fontSize: 14, fontWeight: 500, color: COLOR.text, marginBottom: 8 }}>{item.name}</div>
                     <div style={{ fontSize: 13, color: COLOR.text }}>{fmtWon(item.purchasePrice)}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
