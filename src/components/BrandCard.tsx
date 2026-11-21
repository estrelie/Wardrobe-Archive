import { useState } from "react";
import type { BrandWithStats } from "../types/brand";
import { COLOR } from "../constants/design";
import { fmtWon } from "../lib/format";
import { BrandLogo } from "./BrandFields";

interface BrandCardProps {
  brand: BrandWithStats;
  onClick: () => void;
}
interface BrandCardProps {
  brand: BrandWithStats;
  onClick: () => void;
}

export function BrandCard({ brand, onClick }: BrandCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover ? "#C9C9C9" : COLOR.border}`,
        borderRadius: 8,
        padding: 20,
        background: COLOR.bg,
        cursor: "pointer",
        transition: "border-color .15s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left Accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: brand.color || "#B8B8B8",
        }}
      />

      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <BrandLogo src={brand.logo} size={18} />

        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: COLOR.text,
            lineHeight: 1.2,
          }}
        >
          {brand.name}
        </div>
      </div>

      {/* Category */}
      <div
        style={{
          fontSize: 12,
          color: COLOR.subtext,
          marginBottom: 16,
          paddingLeft: brand.logo ? 26 : 0,
          textAlign: "left",
          width: "100%",
        }}
      >
        {brand.tier}
      </div>

      {/* Bottom */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${COLOR.border}`,
          paddingTop: 12,
          fontSize: 12.5,
          color: COLOR.subtext,
        }}
      >
        <span>{brand.items.length} items</span>

        <span>{fmtWon(brand.total)}</span>
      </div>
    </div>
  );
}
