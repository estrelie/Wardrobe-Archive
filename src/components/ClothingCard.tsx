import { useState } from "react";
import { Heart } from "lucide-react";
import type { ClothingItem } from "../types/clothing";
import { COLOR } from "../constants/design";
import { BrandLogo } from "./BrandFields";

/* ---------------------------------------------------------
   Gallery card
--------------------------------------------------------- */
interface ClothingCardProps {
  item: ClothingItem;
  onOpen?: (item: ClothingItem) => void;
  onToggleFavorite?: (id: string) => void;
  accentColor?: string;
}
export function ClothingCard({ item, onOpen, onToggleFavorite, accentColor }: ClothingCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => onOpen && onOpen(item)} style={{ cursor: "pointer", position: "relative" }}>
      
      {/* Optional Brand Hover Accent */}
      {accentColor && (
        <div style={{ 
          position: "absolute", left: -8, top: 8, bottom: 8, width: 3, 
          background: accentColor, borderRadius: 2, 
          opacity: hover ? 1 : 0, transition: "opacity 0.2s ease", zIndex: 10 
        }} />
      )}

      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", background: COLOR.bg2, borderRadius: 4 }}>
        {item.images[0]
          ? <img src={item.images[0]} alt={item.name} style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hover ? "scale(1.035)" : "scale(1)", transition: "transform 0.5s ease",
            }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: COLOR.subtext }}></div>}
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(item.id); }} style={{
          position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.85)",
          border: "none", borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          zIndex: 10
        }}>
          <Heart size={14} color={COLOR.text} fill={item.favorite ? COLOR.text : "none"} strokeWidth={1.6} />
        </button>
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0))",
          padding: "20px 10px 10px", opacity: hover ? 1 : 0, transition: "opacity 0.25s ease",
        }}>
          <div style={{ color: "#fff", fontSize: 11.5 }}>
            {item.category}{item.seasons.length ? ` · ${item.seasons.join(" · ")}` : ""}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <BrandLogo src={item.brandInfo?.logo} size={13} />
          <span style={{ fontSize: 11, color: COLOR.subtext, letterSpacing: 0.4, textTransform: "uppercase" }}>{item.brandName}</span>
        </div>
        <div style={{ fontSize: 14, color: COLOR.text, marginTop: 2 }}>{item.name}</div>
      </div>
    </div>
  );
}
