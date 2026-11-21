import React, { useEffect, useRef } from "react";
import { ArrowUpDown } from "lucide-react";
import type { BrandWithStats } from "../types/brand";
import { EmptyState, IconBtn, PageHeader } from "../components/common";
import { BRAND_SORT_FIELDS, SortPanel } from "../components/SortPanel";
import type { SortState } from "../components/SortPanel";
import { BrandCard } from "../components/BrandCard";

// --- src/pages/BrandsPage.tsx ---
interface BrandsPageProps {
  brandsWithStats: BrandWithStats[];
  onSelectBrand: (b: BrandWithStats) => void;
  sorts: SortState[];
  setSorts: React.Dispatch<React.SetStateAction<SortState[]>>;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export function BrandsPage({ brandsWithStats, onSelectBrand, sorts, setSorts, sortOpen, setSortOpen }: BrandsPageProps) {
  const sortRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (sortRef.current && !sortRef.current.contains(target)
    ) { setSortOpen(false); }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [setSortOpen]);

  return (
    <div>
      <PageHeader 
        title="Brands" 
        action={
          <div 
           ref={sortRef}
           style={{ position: "relative", zIndex: 20 }}
          >
            <IconBtn onClick={() => setSortOpen((v) => !v)} active={sortOpen || sorts.length > 0}>
              <ArrowUpDown size={14} /> Sort {sorts.length > 0 && `(${sorts.length})`}
            </IconBtn>
            {sortOpen && <SortPanel sorts={sorts} setSorts={setSorts} fields={BRAND_SORT_FIELDS} defaultKey="itemsCount" />}
          </div>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {brandsWithStats.map((b) => (
          <BrandCard key={b.id} brand={b} onClick={() => onSelectBrand(b)} />
        ))}
        {brandsWithStats.length === 0 && <EmptyState text="" />}
      </div>
    </div>
  );
}
