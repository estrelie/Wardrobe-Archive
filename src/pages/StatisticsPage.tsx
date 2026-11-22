import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Category, CategoryGroup, Season } from "../types/common";
import type { Brand } from "../types/brand";
import type { ClothingItem } from "../types/clothing";
import type { SaleRecord } from "../types/sale";
import { CATEGORY_GROUPS, CATEGORY_GROUP_LABELS, COLOR, GRAYS } from "../constants/design";
import { fmtWon } from "../lib/format";
import { PageHeader, SectionTitle } from "../components/common";

// --- src/pages/StatisticsPage.tsx ---
interface StatisticsPageProps {
  items: ClothingItem[];
  brands: Brand[];
  sales: SaleRecord[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value);
  const unit = value === 1 ? "item" : "items";
  const rawName = label ?? payload[0]?.name ?? "";

  const displayName =
  rawName === "봄/가을"
    ? "Spring/Fall"
    : rawName === "여름"
    ? "Summer"
    : rawName === "겨울"
    ? "Winter"
    : rawName;

  return (
    <div
      style={{
        background: COLOR.bg,
        border: `1px solid ${COLOR.border}`,
        borderRadius: 6,
        padding: "8px 10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: COLOR.subtext,
          fontWeight: 400,
          whiteSpace: "nowrap",
        }}
      >
        {displayName} │ {value} {unit}
      </div>
    </div>
  );
}

export function StatisticsPage({ items, brands }: StatisticsPageProps) {
  const [seasonTab, setSeasonTab] = useState<Season | "All">("All");
  const filteredItems = useMemo(() => {
    if (seasonTab === "All") return items;
    return items.filter(it => (it.seasons || []).includes(seasonTab));
  }, [items, seasonTab]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const favs = filteredItems.filter((i) => i.favorite).length;
    const favRatio = total > 0 ? ((favs / total) * 100).toFixed(1) : "0.0";

    const pricedItems = filteredItems.filter((i) => Number(i.purchasePrice) > 0);
    const totalSpend = filteredItems.reduce((sum, i) => sum + Number(i.purchasePrice || 0), 0);
    const avgSpend = pricedItems.length > 0 ? Math.round(totalSpend / pricedItems.length) : 0;

    const byCategory: Record<string, number> = {};
    const byBrand: Record<string, number> = {};
    const byAge = {
      "<1 Year": 0,
      "1–2 Years": 0,
      "2–3 Years": 0,
      "3+ Years": 0,
    };

    filteredItems.forEach((i) => {
      if (i.category) {
        const group = Object.entries(CATEGORY_GROUPS).find(([, categories]) =>
          categories.includes(i.category as Category)
      )?.[0] ?? "Others";
      byCategory[group] = (byCategory[group] || 0) + 1;
      }
      
      const brandTier = i.brandInfo?.tier || "보세";
      if (i.brandId && brandTier !== "보세") {
        byBrand[i.brandId] = (byBrand[i.brandId] || 0) + 1;
      }

if (i.purchaseDate) {
  const purchase = new Date(i.purchaseDate);
  const today = new Date();

  const years =
    (today.getTime() - purchase.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);

  if (years < 1) byAge["<1 Year"]++;
  else if (years < 2) byAge["1–2 Years"]++;
  else if (years < 3) byAge["2–3 Years"]++;
  else byAge["3+ Years"]++;
}

    });

const categoryOrder: CategoryGroup[] = [
  "Tops",
  "Bottoms",
  "Dress",
  "Outerwear",
  "Others",
];

const category = categoryOrder.map((group) => ({
  name: CATEGORY_GROUP_LABELS[group],
  value: byCategory[group] || 0,
}));

const totalAgeItems = Object.values(byAge).reduce((sum, n) => sum + n, 0);

    const age = Object.entries(byAge).map(([name, value]) => ({
      name, value,
      percent: totalAgeItems > 0 ? (value / totalAgeItems) * 100 : 0,
    }));

    const brandEntries = Object.entries(byBrand)
    .map(([bId, value]) => {
      const bName = brands.find(b => b.id === bId)?.name || "Unknown";
      return { id: bId, name: bName, value };
    })
    .sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });

const brandChart = brandEntries.slice(0, 5);

    return {
      total, favs, favRatio,
      totalSpend, avgSpend,
      category, age, brandChart,
    };
  }, [filteredItems, brands]);

  const StatBlock = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", }}>
      <div style={{ fontSize: 12, color: COLOR.subtext, marginBottom: 8, letterSpacing: 0.2, textAlign: "center", }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, }}>
        <span style={{ fontSize: 24, fontWeight: 500, color: COLOR.text, letterSpacing: -0.5 }}>{value}</span>
        {sub && <span style={{ fontSize: 13, color: COLOR.subtext }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      <PageHeader title="Statistics" />

      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${COLOR.border}`, marginBottom: 36 }}>
        {[{key: "All", label: "All"}, {key: "봄/가을", label: "Spring / Fall"}, {key: "여름", label: "Summer"}, {key: "겨울", label: "Winter"}].map(tab => {
          const isActive = seasonTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSeasonTab(tab.key as Season | "All")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 4px 10px", fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                color: isActive ? COLOR.text : COLOR.subtext,
                borderBottom: isActive ? `2px solid ${COLOR.text}` : "2px solid transparent",
                marginBottom: "-1px"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Overview</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 40px", justifyItems: "center", }}>
          <StatBlock label="Total Items" value={`${stats.total}`} />
          <StatBlock label="Favorites" value={`${stats.favs}`} sub={`/ ${stats.total} (${stats.favRatio}%)`} />
          <StatBlock label="Spending (Owned)" value={fmtWon(stats.totalSpend)} />
          <StatBlock label="Avg. Price (Owned)" value={fmtWon(stats.avgSpend)} />
        </div>
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Category</SectionTitle> 
        {stats.category.length > 0 ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 20, alignItems: "center" }}>
            <div style={{ width: "100%", height: 220 }}>
  
<ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={[...stats.category]}
    layout="vertical"
    margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
  >
    <CartesianGrid 
      stroke={COLOR.border}
      strokeOpacity={0.35}
      strokeDasharray="3 3"
      horizontal={false}
    />
    <XAxis 
      type="number"
      allowDecimals={false}
      domain={[0, "dataMax"]}
      tick={{ fontSize: 11, fill: COLOR.subtext, }}
      tickMargin={6}
      axisLine={{ stroke: COLOR.border }}
      tickLine={{ stroke: COLOR.border }}
    />
    <YAxis
      type="category"
      dataKey="name"
      width={90}
      tick={{ fontSize: 12, fill: COLOR.subtext }}
      axisLine={{ stroke: COLOR.border }}
      tickLine={{ stroke: COLOR.border }}
    />
    <Tooltip
      content={<CustomTooltip />}
      offset={16}
      cursor={{ fill: "rgba(0,0,0,0.04)",
      }}
    />
    <Bar
      dataKey="value"
      radius={[0, 4, 4, 0]}
      fill={GRAYS[3]}
      barSize={20}
    />
  </BarChart>
</ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

      <div style={{ marginBottom: 60 }}>
        <SectionTitle>Top Brands</SectionTitle>
        {stats.brandChart.length > 0 ? (
          
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 72,
    marginTop: 20,
  }}
>
  <div style={{ width: 180, height: 180 }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={stats.brandChart}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
          startAngle={90}
          endAngle={-270}
        >
          {stats.brandChart.map((_, i) => (
            <Cell key={i} fill={GRAYS[i % GRAYS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={<CustomTooltip />}
          cursor={false}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: 180,
  }}
>
  {stats.brandChart.map((b, i) => (
    <div
      key={b.id}
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 13,
        color: COLOR.subtext,
        width: 170,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: GRAYS[i % GRAYS.length],
        }}
      />
      <span
        style={{
          flex: 1,
          marginLeft: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      title={b.name}
      >
  {b.name}
</span>
      <span
        style={{
          width: 18,
          textAlign: "right",
          color: COLOR.subtext,
          fontWeight: 400,
        }}
      >
        {b.value}
      </span>
    </div>
  ))}
</div>
</div>
        ) : (
          <div style={{ fontSize: 13, color: COLOR.subtext, padding: "10px 0" }}>-</div>
        )}
      </div>

<div style={{ marginBottom: 60 }}>
  <SectionTitle>Wardrobe Age</SectionTitle>

  {stats.total > 0 ? (
    <>

<div
  style={{
    maxWidth: 760,
    margin: "0 auto",
    position: "relative",
  }}
>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 2,
    fontSize: 11,
    color: COLOR.subtext,
    opacity: 0.75,
    letterSpacing: 0.2,
  }}
>
<span style={{ marginLeft: 8 }}>
  Newer
</span>
<span style={{ marginRight: 8 }}>
  Older
</span>
</div>

      <div
        style={{
          marginTop: 5,
          height: 27,
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
          background: COLOR.bg2,
        }}
      >
        {stats.age
          .filter(a => a.value > 0)
          .map((a, i, arr) => {

            const percent = a.percent;

          return (
            <div
  key={a.name}
  style={{
                width: `${percent}%`,
                background: GRAYS[i],
                transition: "0.25s",
                
                borderTopLeftRadius: i === 0 ? 999 : 0,
                borderBottomLeftRadius: i === 0 ? 999 : 0,
                borderTopRightRadius: i === arr.length - 1 ? 999 : 0,
                borderBottomRightRadius: i === arr.length - 1 ? 999 : 0,

                marginRight: i === arr.length - 1 ? 0 : 2,
              }}
            />
          );
        })}
      </div>
      </div>

      <div
  style={{
    maxWidth: 760,
    margin: "30px auto 0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px 44px",
    fontSize: 13,
    lineHeight: 1, 
    color: COLOR.subtext,
  }}
>
  {stats.age
    .filter((a) => a.value > 0)
    .map((a) => (
      <div
        key={a.name}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: GRAYS[
              stats.age.findIndex((item) => item.name === a.name)
            ],
            transform: "translateY(1px)",
          }}
        />

<span>
  {a.name}
</span>

<span
  style={{
    color: COLOR.subtext,
    opacity: 0.8,
  }}
>
  ({a.value})
</span>

      </div>
    ))}
</div>
        
    </>
  ) : (
    <div
      style={{
        fontSize: 13,
        color: COLOR.subtext,
        padding: "10px 0",
      }}
    >
      -
    </div>
  )}
</div>

    </div>
  );
}
